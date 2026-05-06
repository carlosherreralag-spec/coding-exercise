/**
 * run-simulator.ts
 * ─────────────────
 * Simulates a Kinesis buffer input and runs the Lambda handler
 * without requiring real AWS or MySQL.
 *
 * Usage:
 *   npx ts-node src/simulator/run-simulator.ts
 *
 * Environment options:
 *   SCENARIO=normal | duplicates | mixed | empty   (default: normal)
 */

// ─── 1. Register mocks BEFORE importing the handler ─────────────────────────

import { mysqlMock, outpulseClientMock, RateLimitError, ValidationError, validateQuery, executeLog, executeJoin } from './mocks';

// Expose globals that candidate-exercise.ts relies on via `require` and `declare`
(global as any).RateLimitError    = RateLimitError;
(global as any).ValidationError   = ValidationError;
(global as any).outpulseClient    = outpulseClientMock;

// Intercept require('mysql2/promise') to return the mock
const Module = require('module');
const originalLoad = Module._load.bind(Module);
Module._load = (request: string, ...args: any[]) => {
  if (request === 'mysql2/promise') return mysqlMock;
  return originalLoad(request, ...args);
};

// ─── 2. Import handler (mocks are already active) ───────────────────────────

// eslint-disable-next-line import/first
import { handler } from '../coding-candidate-exercise';

// ─── 3. Import sample batches ───────────────────────────────────────────────

import {
  BATCH_NORMAL,
  BATCH_DUPLICATES,
  BATCH_MIXED_STATUS,
  BATCH_EMPTY,
  KinesisRecord,
} from './fixtures';

import {
  BATCH_1000,
  BATCH_1000_ALL_IN_PROGRESS,
  BATCH_1000_ALL_UNIQUE,
  BATCH_1000_ALL_SKIPPED,
} from './fixtures-large';

// ─── 4. Select scenario ─────────────────────────────────────────────────────

const scenarioKey = (process.env.SCENARIO ?? 'normal').toLowerCase();


const SCENARIOS: Record<string, { label: string; batch: KinesisRecord[] }> = {
  normal:              { label: '3 different campaigns "In Progress"',          batch: BATCH_NORMAL },
  duplicates:          { label: 'camp-001 repeated 3 times (should process 1)', batch: BATCH_DUPLICATES },
  mixed:               { label: '1 in progress + 1 completed + 1 cancelled',    batch: BATCH_MIXED_STATUS },
  empty:               { label: 'Empty batch',                                   batch: BATCH_EMPTY },
  large:               { label: '1000 records — mixed status + duplicates',       batch: BATCH_1000 },
  'large-all-active':  { label: '1000 records — all In Progress',                batch: BATCH_1000_ALL_IN_PROGRESS },
  'large-all-unique':  { label: '1000 records — all unique campaignIds',          batch: BATCH_1000_ALL_UNIQUE },
  'large-all-skipped': { label: '1000 records — all Completed/Cancelled',         batch: BATCH_1000_ALL_SKIPPED },
};

const scenario = SCENARIOS[scenarioKey] ?? SCENARIOS['normal'];

// ─── 5. Run ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log(' Campaign Dispatcher — Kinesis Buffer Simulator');
  console.log('═══════════════════════════════════════════════════');
  console.log(`\nScenario : ${scenarioKey} — ${scenario.label}`);
  console.log(`Records  : ${scenario.batch.length}\n`);

  console.log('\n--- Processing... ---\n');

  const start  = Date.now();
  const result:any = await handler({ Records: scenario.batch });
  const ms     = Date.now() - start;

  console.log('\n--- Result ---');
  console.log(`  successCount : ${result.successCount}`);
  console.log(`  skipCount    : ${result.skipCount}`);
  console.log(`  errorCount   : ${result.errorCount}`);
  console.log(`  elapsed      : ${ms}ms`);
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
