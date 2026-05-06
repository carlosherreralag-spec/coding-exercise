/**
 * Large-scale fixture: 1000 Kinesis records for load/stress testing.
 * Generated programmatically — do not edit manually.
 */

import { KinesisRecord, makeKinesisRecord } from './fixtures';

// ─── Seed data pools ──────────────────────────────────────────────────────────

const STATUS_CODES = ['In Progress', 'In Progress', 'In Progress', 'Completed', 'Cancelled'] as const;
// Weighted: ~60% In Progress, ~20% Completed, ~20% Cancelled

const CHANNELS = ['Email', 'SMS', 'Push'] as const;

const CAMPAIGN_NAMES = [
  'Spring Renewal', 'Onboarding Flow', 'Win-back Q2', 'Cross-sell Insurance',
  'Policy Renewal Reminder', 'Lapsed Customer Re-engagement', 'Premium Upsell',
  'Claims Follow-up', 'NPS Survey', 'Loyalty Reward', 'Annual Review',
  'New Product Launch', 'Referral Program', 'Churn Prevention', 'Welcome Series',
  'Birthday Offer', 'Early Renewal Discount', 'VIP Outreach', 'Digital Migration',
  'Paperless Billing Push',
];

const LINE_OF_BUSINESS = ['CRM', 'Life', 'Non-Life', 'Health', 'Travel', 'Property'];

// ─── Generator ────────────────────────────────────────────────────────────────

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates `count` Kinesis records with realistic variation:
 * - ~60% In Progress (will be processed)
 * - ~20% Completed / ~20% Cancelled (will be skipped)
 * - Some campaignIds repeat across records (deduplication test)
 * - campaignIds distributed across ~200 unique campaigns (5 records avg per campaign)
 */
function generateRecords(count: number): KinesisRecord[] {
  // Pre-build a pool of ~200 campaign IDs so there are natural duplicates
  const CAMPAIGN_POOL_SIZE = 200;
  const campaignPool = Array.from({ length: CAMPAIGN_POOL_SIZE }, (_, i) => ({
    campaignId:               `camp-${String(i + 1).padStart(4, '0')}`,
    campaignName:             randomItem(CAMPAIGN_NAMES),
    lineOfBusinessCode:       randomItem(LINE_OF_BUSINESS),
    communicationChannelCode: randomItem(CHANNELS),
  }));

  return Array.from({ length: count }, () => {
    const base      = randomItem(campaignPool);
    const statusCode = randomItem(STATUS_CODES);
    return makeKinesisRecord({ ...base, statusCode });
  });
}

// ─── Exported batches ─────────────────────────────────────────────────────────

/** 1000 records with realistic distribution (duplicates + mixed status) */
export const BATCH_1000: KinesisRecord[] = generateRecords(1000);

/** 1000 records all "In Progress" — maximum processing load */
export const BATCH_1000_ALL_IN_PROGRESS: KinesisRecord[] = Array.from(
  { length: 1000 },
  (_, i) => makeKinesisRecord({
    campaignId:               `camp-${String((i % 200) + 1).padStart(4, '0')}`,
    campaignName:             CAMPAIGN_NAMES[i % CAMPAIGN_NAMES.length],
    statusCode:               'In Progress',
    lineOfBusinessCode:       LINE_OF_BUSINESS[i % LINE_OF_BUSINESS.length],
    communicationChannelCode: CHANNELS[i % CHANNELS.length],
  }),
);

/** 1000 records all unique campaignIds — no deduplication savings */
export const BATCH_1000_ALL_UNIQUE: KinesisRecord[] = Array.from(
  { length: 1000 },
  (_, i) => makeKinesisRecord({
    campaignId:               `camp-unique-${String(i + 1).padStart(5, '0')}`,
    campaignName:             CAMPAIGN_NAMES[i % CAMPAIGN_NAMES.length],
    statusCode:               'In Progress',
    lineOfBusinessCode:       LINE_OF_BUSINESS[i % LINE_OF_BUSINESS.length],
    communicationChannelCode: CHANNELS[i % CHANNELS.length],
  }),
);

/** 1000 records all skippable (Completed or Cancelled) — zero processing */
export const BATCH_1000_ALL_SKIPPED: KinesisRecord[] = Array.from(
  { length: 1000 },
  (_, i) => makeKinesisRecord({
    campaignId:               `camp-skip-${String(i + 1).padStart(5, '0')}`,
    campaignName:             CAMPAIGN_NAMES[i % CAMPAIGN_NAMES.length],
    statusCode:               i % 2 === 0 ? 'Completed' : 'Cancelled',
    lineOfBusinessCode:       LINE_OF_BUSINESS[i % LINE_OF_BUSINESS.length],
    communicationChannelCode: CHANNELS[i % CHANNELS.length],
  }),
);
