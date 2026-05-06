/**
 * Campaign Dispatcher - Technical Exercise
 * =========================================
 *
 * CONTEXT:
 * We have a Lambda triggered by Kinesis that receives batches of
 * 'campaign.updated' events from our CRM DataHub. For each event we:
 *   1. Fetch the campaign's contact members with existing active contacts from our database
 *   2. Build the payload expected by Outpulse (our external engagement platform)
 *   3. Submit the payload to Outpulse for delivery
 *
 *
 * YOUR TASK:
 * Review the implementation below, identify every problem you can find,
 * and rewrite processCampaignBatch so it is production-ready.
 * Be prepared to explain each change and why it matters.
 */

// ============================================================================
// EXTERNAL DEPENDENCIES
// ============================================================================

const mysql = require('mysql2/promise');
import { validateQuery } from './simulator/mocks';

async function getCampaignMembersWithActiveContacts(
  campaignId: string
): Promise<CampaignMemberWithContact[]> {
  const conn = await mysql.createConnection({
    host:     'localhost',
    user:     'root',
    password: 'secret',
    database: 'crm_db',
  });

  const [rows] = await conn.execute(`
    SELECT...
  `);

  return (rows as any[])
}

async function submitToOutpulse(payload: OutpulsePayload): Promise<void> {
  // Throws RateLimitError when Outpulse rate limit is exceeded (back off and retry)
  // Throws ValidationError if the payload is rejected (do not retry)
  await outpulseClient.submit(payload);
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

async function processCampaignBatch(records: KinesisRecord[]): Promise<IFollowUpProcess> {
  const result: IFollowUpProcess = { successCount: 0, skipCount: 0, errorCount: 0 };

  for (const record of records) {
    const event = JSON.parse(record.kinesis.data);
    const campaign = event.data.resource;

    if (campaign.statusCode !== 'In Progress') {
      continue;
    }

    const members = await getCampaignMembersWithActiveContacts(campaign.campaignId);

    const payload: OutpulsePayload = {
      campaignId:   campaign.campaignId,
      campaignName: campaign.campaignName,
      channel:      campaign.communicationChannelCode,
      contacts: members.map((m: any) => ({
        contactId: m.contact.contactId,
        email:     m.contact.email,
        phone:     m.contact.phone,
        active:    m.contact.active,
      })),
    };

    await submitToOutpulse(payload);
    result.successCount++;
  }

  return result;
}

export const handler = (event: { Records: KinesisRecord[] }) => {
  processCampaignBatch(event.Records);
}

// ============================================================================
// TYPE DEFINITIONS (for reference)
// ============================================================================

interface KinesisRecord {
  kinesis: {
    data: string; // base64-encoded IKinesisDatahubEvent<Campaign>
    approximateArrivalTimestamp: number;
    sequenceNumber: string;
  };
  eventSource: 'aws:kinesis';
}


// ============================================================================
// DOMAIN CLASSES
// ============================================================================

/**
 * Maps to the `campaign_members` table.
 * Represents the membership record linking a contact to a campaign.
 */
interface CampaignMember {
  contactId: string;
  optedOut: boolean;
}

/**
 * Maps to the `contacts` table.
 * Holds the personal/contact data.
 */
interface Contact {
  contactId: string;
  email: string;
  phone: string;
  active: boolean;
}

/**
 * Result of the JOIN between `campaign_members` and `contacts`.
 */
class CampaignMemberWithContact {
  readonly member: CampaignMember;
  readonly contact: Contact;

  constructor(member: CampaignMember, contact: Contact) {
    this.member  = member;
    this.contact = contact;
  }

  /** Returns true only when the member is reachable and has a valid email. */
  isEligibleForEmail(): boolean {
    return !this.member.optedOut && this.contact.email.length > 0;
  }
}

interface OutpulsePayload {
  campaignId: string;
  campaignName: string;
  channel: 'Email' | 'SMS' | 'Push';
  contacts: Array<{
    contactId: string;
    email: string;
    phone: string;
    active: boolean;
  }>;
}

interface IFollowUpProcess {
  successCount: number;
  skipCount: number;
  errorCount: number;
}

declare const outpulseClient: {
  submit(payload: OutpulsePayload): Promise<void>;
};
