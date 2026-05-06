/**
 * Factories to build base64-encoded KinesisRecords
 * as they would be sent by AWS Kinesis / DataHub.
 */

export interface KinesisRecord {
  kinesis: {
    data: string;
    approximateArrivalTimestamp: number;
    sequenceNumber: string;
  };
  eventSource: 'aws:kinesis';
}

export interface Campaign {
  campaignId: string;
  campaignName: string;
  statusCode: 'In Progress' | 'Completed' | 'Cancelled';
  lineOfBusinessCode: string;
  communicationChannelCode: 'Email' | 'SMS' | 'Push';
}

let seq = 0;

export function makeKinesisRecord(campaign: Campaign): KinesisRecord {
  const event = {
    specversion: '1.0',
    id: `evt-${++seq}`,
    source: 'crm-datahub',
    type: 'campaign.updated',
    time: new Date().toISOString(),
    traceparent: `00-${seq.toString().padStart(32, '0')}-0000000000000001-01`,
    tracestate: '',
    data: { resource: campaign },
  };

  const json = JSON.stringify(event);
  const base64 = Buffer.from(json, 'utf-8').toString('base64');

  return {
    kinesis: {
      data: base64,
      approximateArrivalTimestamp: Date.now() / 1000,
      sequenceNumber: seq.toString().padStart(20, '0'),
    },
    eventSource: 'aws:kinesis',
  };
}

// ─── Sample batches ──────────────────────────────────────────────────────────

/** Normal batch: 3 different campaigns in progress */
export const BATCH_NORMAL: KinesisRecord[] = [
  makeKinesisRecord({ campaignId: 'camp-001', campaignName: 'Spring Renewal', statusCode: 'In Progress', lineOfBusinessCode: 'CRM', communicationChannelCode: 'Email' }),
  makeKinesisRecord({ campaignId: 'camp-002', campaignName: 'Onboarding Flow', statusCode: 'In Progress', lineOfBusinessCode: 'CRM', communicationChannelCode: 'SMS' }),
  makeKinesisRecord({ campaignId: 'camp-003', campaignName: 'Win-back Q2',     statusCode: 'In Progress', lineOfBusinessCode: 'CRM', communicationChannelCode: 'Push' }),
];

/** Duplicates batch: camp-001 appears 3 times → should be processed only once */
export const BATCH_DUPLICATES: KinesisRecord[] = [
  makeKinesisRecord({ campaignId: 'camp-001', campaignName: 'Spring Renewal', statusCode: 'In Progress', lineOfBusinessCode: 'CRM', communicationChannelCode: 'Email' }),
  makeKinesisRecord({ campaignId: 'camp-001', campaignName: 'Spring Renewal', statusCode: 'In Progress', lineOfBusinessCode: 'CRM', communicationChannelCode: 'Email' }),
  makeKinesisRecord({ campaignId: 'camp-001', campaignName: 'Spring Renewal', statusCode: 'In Progress', lineOfBusinessCode: 'CRM', communicationChannelCode: 'Email' }),
];

/** Mixed batch: in progress + completed + cancelled */
export const BATCH_MIXED_STATUS: KinesisRecord[] = [
  makeKinesisRecord({ campaignId: 'camp-001', campaignName: 'Spring Renewal', statusCode: 'In Progress', lineOfBusinessCode: 'CRM', communicationChannelCode: 'Email' }),
  makeKinesisRecord({ campaignId: 'camp-002', campaignName: 'Old Campaign',   statusCode: 'Completed',   lineOfBusinessCode: 'CRM', communicationChannelCode: 'Email' }),
  makeKinesisRecord({ campaignId: 'camp-003', campaignName: 'Cancelled One',  statusCode: 'Cancelled',   lineOfBusinessCode: 'CRM', communicationChannelCode: 'SMS'   }),
];

/** Empty batch */
export const BATCH_EMPTY: KinesisRecord[] = [];
