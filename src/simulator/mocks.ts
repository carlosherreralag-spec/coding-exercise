/**
 * External dependency mocks:
 *  - mysql2/promise  →  in-memory data
 *  - outpulseClient  →  console log
 *  - RateLimitError / ValidationError
 */

// ─── Error classes ────────────────────────────────────────────────────────

export class RateLimitError extends Error {
  constructor(msg = 'Rate limit exceeded') {
    super(msg);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends Error {
  constructor(msg = 'Payload validation failed') {
    super(msg);
    this.name = 'ValidationError';
  }
}

// ─── In-memory database — two separate tables ────────────────────────────

// Simulated query latency in ms (change to make queries slower/faster)
const DB_QUERY_DELAY_MS = 800;

// ── Table: campaign_members ────────────────────────────────────────────────
interface CampaignMemberRow {
  member_id: string; campaign_id: string; contact_id: string;
  opted_out: boolean; enrolled_at: string; unenrolled_at: string | null;
  enrollment_source: string; priority_score: number; retry_count: number;
  last_attempt_at: string | null; last_attempt_status: string | null;
  created_at: string; updated_at: string; deleted_at: string | null;
}

// ── Table: contacts ────────────────────────────────────────────────────────
interface ContactRow {
  contact_id: string; first_name: string; last_name: string;
  email: string; phone: string; active: boolean;
  secondary_email: string | null; secondary_phone: string | null;
  preferred_channel: string; language_code: string; country_code: string;
  region: string; postal_code: string; date_of_birth: string; gender: string;
  company_name: string | null; job_title: string | null;
  policy_number: string; policy_type: string; policy_status: string;
  policy_start_date: string; policy_end_date: string;
  premium_amount: number; risk_score: number;
  gdpr_consent: boolean; gdpr_consent_date: string;
  marketing_opt_in: boolean; sms_opt_in: boolean; push_opt_in: boolean;
  last_login_at: string; last_purchase_at: string;
  lifetime_value: number; nps_score: number; segment_code: string;
  crm_source: string; external_id: string; notes: string | null;
  contact_created_at: string; contact_updated_at: string;
}

export const CAMPAIGN_MEMBERS_TABLE: CampaignMemberRow[] = [
  { member_id: 'm1',  campaign_id: 'camp-001', contact_id: 'ct1',  opted_out: false, enrolled_at: '2024-01-10', unenrolled_at: null, enrollment_source: 'manual',    priority_score: 0.95, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm2',  campaign_id: 'camp-001', contact_id: 'ct2',  opted_out: false, enrolled_at: '2024-01-11', unenrolled_at: null, enrollment_source: 'import',    priority_score: 0.72, retry_count: 1, last_attempt_at: '2024-02-01T10:00:00Z', last_attempt_status: 'sent', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm3',  campaign_id: 'camp-001', contact_id: 'ct3',  opted_out: true,  enrolled_at: '2024-01-12', unenrolled_at: '2024-02-01', enrollment_source: 'api', priority_score: 0.10, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm6',  campaign_id: 'camp-001', contact_id: 'ct6',  opted_out: false, enrolled_at: '2024-01-13', unenrolled_at: null, enrollment_source: 'manual',    priority_score: 0.88, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm7',  campaign_id: 'camp-001', contact_id: 'ct7',  opted_out: false, enrolled_at: '2024-01-14', unenrolled_at: null, enrollment_source: 'import',    priority_score: 0.61, retry_count: 2, last_attempt_at: '2024-03-01T09:00:00Z', last_attempt_status: 'failed', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm8',  campaign_id: 'camp-001', contact_id: 'ct8',  opted_out: false, enrolled_at: '2024-01-15', unenrolled_at: null, enrollment_source: 'api',       priority_score: 0.45, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm9',  campaign_id: 'camp-001', contact_id: 'ct9',  opted_out: false, enrolled_at: '2024-01-16', unenrolled_at: null, enrollment_source: 'manual',    priority_score: 0.33, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm4',  campaign_id: 'camp-002', contact_id: 'ct4',  opted_out: false, enrolled_at: '2024-02-01', unenrolled_at: null, enrollment_source: 'import',    priority_score: 0.55, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-02-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm10', campaign_id: 'camp-002', contact_id: 'ct10', opted_out: false, enrolled_at: '2024-02-02', unenrolled_at: null, enrollment_source: 'manual',    priority_score: 0.80, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-02-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm11', campaign_id: 'camp-002', contact_id: 'ct11', opted_out: true,  enrolled_at: '2024-02-03', unenrolled_at: '2024-03-01', enrollment_source: 'api', priority_score: 0.20, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-02-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm12', campaign_id: 'camp-002', contact_id: 'ct12', opted_out: false, enrolled_at: '2024-02-04', unenrolled_at: null, enrollment_source: 'import',    priority_score: 0.67, retry_count: 1, last_attempt_at: '2024-03-10T11:00:00Z', last_attempt_status: 'sent', created_at: '2024-02-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm5',  campaign_id: 'camp-003', contact_id: 'ct5',  opted_out: false, enrolled_at: '2024-03-01', unenrolled_at: null, enrollment_source: 'manual',    priority_score: 0.90, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-03-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm13', campaign_id: 'camp-003', contact_id: 'ct13', opted_out: false, enrolled_at: '2024-03-02', unenrolled_at: null, enrollment_source: 'api',       priority_score: 0.75, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-03-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm14', campaign_id: 'camp-003', contact_id: 'ct14', opted_out: false, enrolled_at: '2024-03-03', unenrolled_at: null, enrollment_source: 'import',    priority_score: 0.42, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-03-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm15', campaign_id: 'camp-003', contact_id: 'ct15', opted_out: true,  enrolled_at: '2024-03-04', unenrolled_at: '2024-04-01', enrollment_source: 'manual', priority_score: 0.15, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-03-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  { member_id: 'm16', campaign_id: 'camp-003', contact_id: 'ct16', opted_out: false, enrolled_at: '2024-03-05', unenrolled_at: null, enrollment_source: 'api',       priority_score: 0.58, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-03-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
  // ─ Orphan member (no matching contact) → should NOT appear in JOIN result ─
  { member_id: 'm99', campaign_id: 'camp-001', contact_id: 'ct99', opted_out: false, enrolled_at: '2024-01-20', unenrolled_at: null, enrollment_source: 'manual',    priority_score: 0.50, retry_count: 0, last_attempt_at: null, last_attempt_status: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-04-01T00:00:00Z', deleted_at: null },
];

export const CONTACTS_TABLE: ContactRow[] = [
  { contact_id: 'ct1',  first_name: 'Alice',  last_name: 'Smith',  email: 'alice@example.com',  phone: '+34600000001', active: true,  secondary_email: null, secondary_phone: null, preferred_channel: 'Email', language_code: 'es', country_code: 'ES', region: 'Madrid',    postal_code: '28001', date_of_birth: '1985-06-15', gender: 'F', company_name: null, job_title: null, policy_number: 'POL-ct1',  policy_type: 'premium',  policy_status: 'active', policy_start_date: '2023-01-01', policy_end_date: '2025-01-01', premium_amount: 2400, risk_score: 2, gdpr_consent: true, gdpr_consent_date: '2023-01-15T10:00:00Z', marketing_opt_in: true,  sms_opt_in: false, push_opt_in: true,  last_login_at: '2024-03-20T08:30:00Z', last_purchase_at: '2024-02-10T14:00:00Z', lifetime_value: 9600,  nps_score: 9, segment_code: 'PLATINUM', crm_source: 'salesforce', external_id: 'EXT-ct1',  notes: null, contact_created_at: '2022-06-01T00:00:00Z', contact_updated_at: '2024-04-15T00:00:00Z' },
  { contact_id: 'ct2',  first_name: 'Bob',    last_name: 'Jones',  email: 'bob@example.com',    phone: '+34600000002', active: true,  secondary_email: 'bob2@example.com', secondary_phone: null, preferred_channel: 'SMS', language_code: 'en', country_code: 'GB', region: 'London',    postal_code: 'W1A 1AA', date_of_birth: '1990-03-22', gender: 'M', company_name: 'Acme Ltd', job_title: 'Dev', policy_number: 'POL-ct2',  policy_type: 'standard', policy_status: 'active', policy_start_date: '2023-06-01', policy_end_date: '2025-06-01', premium_amount: 1100, risk_score: 3, gdpr_consent: true, gdpr_consent_date: '2023-06-10T09:00:00Z', marketing_opt_in: true,  sms_opt_in: true,  push_opt_in: false, last_login_at: '2024-03-15T12:00:00Z', last_purchase_at: '2024-01-20T10:00:00Z', lifetime_value: 3300,  nps_score: 7, segment_code: 'SILVER',   crm_source: 'hubspot',    external_id: 'EXT-ct2',  notes: null, contact_created_at: '2022-07-01T00:00:00Z', contact_updated_at: '2024-04-10T00:00:00Z' },
  { contact_id: 'ct3',  first_name: 'Carol',  last_name: 'White',  email: 'carol@example.com',  phone: '+34600000003', active: true,  secondary_email: null, secondary_phone: null, preferred_channel: 'Email', language_code: 'es', country_code: 'ES', region: 'Barcelona', postal_code: '08001', date_of_birth: '1978-11-05', gender: 'F', company_name: null, job_title: null, policy_number: 'POL-ct3',  policy_type: 'basic',    policy_status: 'active', policy_start_date: '2022-01-01', policy_end_date: '2024-01-01', premium_amount: 800,  risk_score: 4, gdpr_consent: true, gdpr_consent_date: '2022-01-20T10:00:00Z', marketing_opt_in: false, sms_opt_in: false, push_opt_in: false, last_login_at: '2024-01-10T07:00:00Z', last_purchase_at: '2023-08-05T11:00:00Z', lifetime_value: 1600,  nps_score: 5, segment_code: 'BRONZE',   crm_source: 'salesforce', external_id: 'EXT-ct3',  notes: 'opted out', contact_created_at: '2021-05-01T00:00:00Z', contact_updated_at: '2024-03-01T00:00:00Z' },
  { contact_id: 'ct4',  first_name: 'Dan',    last_name: 'Brown',  email: 'dan@example.com',    phone: '+34600000004', active: false, secondary_email: null, secondary_phone: null, preferred_channel: 'Email', language_code: 'en', country_code: 'US', region: 'New York',  postal_code: '10001', date_of_birth: '1995-08-30', gender: 'M', company_name: null, job_title: null, policy_number: 'POL-ct4',  policy_type: 'standard', policy_status: 'lapsed', policy_start_date: '2021-01-01', policy_end_date: '2023-01-01', premium_amount: 950,  risk_score: 5, gdpr_consent: false, gdpr_consent_date: '2021-01-05T10:00:00Z', marketing_opt_in: false, sms_opt_in: false, push_opt_in: false, last_login_at: '2023-01-01T00:00:00Z', last_purchase_at: '2022-12-01T00:00:00Z', lifetime_value: 950,   nps_score: 3, segment_code: 'BRONZE',   crm_source: 'manual',     external_id: 'EXT-ct4',  notes: 'inactive', contact_created_at: '2020-01-01T00:00:00Z', contact_updated_at: '2023-01-02T00:00:00Z' },
  { contact_id: 'ct5',  first_name: 'Eva',    last_name: 'Green',  email: 'eva@example.com',    phone: '+34600000005', active: true,  secondary_email: null, secondary_phone: '+34611000005', preferred_channel: 'Push', language_code: 'fr', country_code: 'FR', region: 'Paris',     postal_code: '75001', date_of_birth: '1988-04-12', gender: 'F', company_name: 'GreenCo', job_title: 'CEO', policy_number: 'POL-ct5',  policy_type: 'premium',  policy_status: 'active', policy_start_date: '2023-03-01', policy_end_date: '2025-03-01', premium_amount: 3600, risk_score: 1, gdpr_consent: true, gdpr_consent_date: '2023-03-05T08:00:00Z', marketing_opt_in: true,  sms_opt_in: true,  push_opt_in: true,  last_login_at: '2024-04-01T09:00:00Z', last_purchase_at: '2024-03-15T16:00:00Z', lifetime_value: 10800, nps_score: 10, segment_code: 'PLATINUM', crm_source: 'salesforce', external_id: 'EXT-ct5',  notes: null, contact_created_at: '2021-03-01T00:00:00Z', contact_updated_at: '2024-04-20T00:00:00Z' },
  { contact_id: 'ct6',  first_name: 'David',  last_name: 'Clark',  email: 'david@example.com',  phone: '+34600000006', active: true,  secondary_email: null, secondary_phone: null, preferred_channel: 'Email', language_code: 'es', country_code: 'ES', region: 'Sevilla',   postal_code: '41001', date_of_birth: '1982-09-18', gender: 'M', company_name: null, job_title: null, policy_number: 'POL-ct6',  policy_type: 'premium',  policy_status: 'active', policy_start_date: '2023-01-01', policy_end_date: '2025-01-01', premium_amount: 3200, risk_score: 2, gdpr_consent: true, gdpr_consent_date: '2023-01-15T10:00:00Z', marketing_opt_in: true,  sms_opt_in: false, push_opt_in: true,  last_login_at: '2024-04-05T10:00:00Z', last_purchase_at: '2024-02-20T13:00:00Z', lifetime_value: 12800, nps_score: 9, segment_code: 'PLATINUM', crm_source: 'salesforce', external_id: 'EXT-ct6',  notes: null, contact_created_at: '2022-01-01T00:00:00Z', contact_updated_at: '2024-04-15T00:00:00Z' },
  { contact_id: 'ct7',  first_name: 'Emma',   last_name: 'Davis',  email: 'emma@example.com',   phone: '+34600000007', active: true,  secondary_email: null, secondary_phone: null, preferred_channel: 'Email', language_code: 'es', country_code: 'ES', region: 'Valencia',  postal_code: '46001', date_of_birth: '1993-07-25', gender: 'F', company_name: null, job_title: null, policy_number: 'POL-ct7',  policy_type: 'standard', policy_status: 'active', policy_start_date: '2023-01-01', policy_end_date: '2025-01-01', premium_amount: 950,  risk_score: 3, gdpr_consent: true, gdpr_consent_date: '2023-01-15T10:00:00Z', marketing_opt_in: true,  sms_opt_in: false, push_opt_in: false, last_login_at: '2024-02-10T08:00:00Z', last_purchase_at: '2024-01-15T14:00:00Z', lifetime_value: 2850,  nps_score: 7, segment_code: 'GOLD',     crm_source: 'hubspot',    external_id: 'EXT-ct7',  notes: null, contact_created_at: '2022-03-01T00:00:00Z', contact_updated_at: '2024-04-10T00:00:00Z' },
  { contact_id: 'ct8',  first_name: 'Frank',  last_name: 'Evans',  email: 'frank@example.com',  phone: '+34600000008', active: false, secondary_email: null, secondary_phone: null, preferred_channel: 'SMS',   language_code: 'en', country_code: 'GB', region: 'Manchester', postal_code: 'M1 1AE', date_of_birth: '1975-12-01', gender: 'M', company_name: 'Evans Co', job_title: 'CFO', policy_number: 'POL-ct8',  policy_type: 'standard', policy_status: 'lapsed', policy_start_date: '2020-01-01', policy_end_date: '2022-01-01', premium_amount: 1500, risk_score: 4, gdpr_consent: true, gdpr_consent_date: '2020-01-10T10:00:00Z', marketing_opt_in: false, sms_opt_in: false, push_opt_in: false, last_login_at: '2022-01-01T00:00:00Z', last_purchase_at: '2021-12-01T00:00:00Z', lifetime_value: 3000,  nps_score: 4, segment_code: 'SILVER',   crm_source: 'manual',     external_id: 'EXT-ct8',  notes: null, contact_created_at: '2019-01-01T00:00:00Z', contact_updated_at: '2022-01-02T00:00:00Z' },
  { contact_id: 'ct9',  first_name: 'Grace',  last_name: 'Hall',   email: 'grace@example.com',  phone: '+34600000009', active: true,  secondary_email: null, secondary_phone: null, preferred_channel: 'Email', language_code: 'es', country_code: 'ES', region: 'Bilbao',    postal_code: '48001', date_of_birth: '1999-02-14', gender: 'F', company_name: null, job_title: null, policy_number: 'POL-ct9',  policy_type: 'basic',    policy_status: 'active', policy_start_date: '2024-01-01', policy_end_date: '2026-01-01', premium_amount: 600,  risk_score: 3, gdpr_consent: true, gdpr_consent_date: '2024-01-05T10:00:00Z', marketing_opt_in: true,  sms_opt_in: true,  push_opt_in: true,  last_login_at: '2024-04-10T09:30:00Z', last_purchase_at: '2024-04-01T10:00:00Z', lifetime_value: 600,   nps_score: 8, segment_code: 'BRONZE',   crm_source: 'api',        external_id: 'EXT-ct9',  notes: null, contact_created_at: '2024-01-01T00:00:00Z', contact_updated_at: '2024-04-15T00:00:00Z' },
  { contact_id: 'ct10', first_name: 'Helen',  last_name: 'King',   email: 'helen@example.com',  phone: '+34600000010', active: true,  secondary_email: null, secondary_phone: null, preferred_channel: 'Email', language_code: 'es', country_code: 'ES', region: 'Madrid',    postal_code: '28002', date_of_birth: '1987-05-20', gender: 'F', company_name: null, job_title: null, policy_number: 'POL-ct10', policy_type: 'standard', policy_status: 'active', policy_start_date: '2023-01-01', policy_end_date: '2025-01-01', premium_amount: 1200, risk_score: 3, gdpr_consent: true, gdpr_consent_date: '2023-01-15T10:00:00Z', marketing_opt_in: true,  sms_opt_in: false, push_opt_in: true,  last_login_at: '2024-03-25T08:00:00Z', last_purchase_at: '2024-02-15T12:00:00Z', lifetime_value: 3600,  nps_score: 8, segment_code: 'GOLD',     crm_source: 'salesforce', external_id: 'EXT-ct10', notes: null, contact_created_at: '2022-06-01T00:00:00Z', contact_updated_at: '2024-04-15T00:00:00Z' },
  { contact_id: 'ct11', first_name: 'Ivan',   last_name: 'Lee',    email: 'ivan@example.com',   phone: '+34600000011', active: true,  secondary_email: null, secondary_phone: null, preferred_channel: 'Push',  language_code: 'en', country_code: 'US', region: 'Chicago',   postal_code: '60601', date_of_birth: '1991-10-08', gender: 'M', company_name: null, job_title: null, policy_number: 'POL-ct11', policy_type: 'standard', policy_status: 'active', policy_start_date: '2023-01-01', policy_end_date: '2025-01-01', premium_amount: 1100, risk_score: 3, gdpr_consent: true, gdpr_consent_date: '2023-01-15T10:00:00Z', marketing_opt_in: true,  sms_opt_in: false, push_opt_in: true,  last_login_at: '2024-02-20T11:00:00Z', last_purchase_at: '2024-01-10T09:00:00Z', lifetime_value: 2200,  nps_score: 6, segment_code: 'SILVER',   crm_source: 'hubspot',    external_id: 'EXT-ct11', notes: null, contact_created_at: '2022-08-01T00:00:00Z', contact_updated_at: '2024-04-10T00:00:00Z' },
  { contact_id: 'ct12', first_name: 'Julia',  last_name: 'Martin', email: 'julia@example.com',  phone: '+34600000012', active: true,  secondary_email: 'julia2@example.com', secondary_phone: null, preferred_channel: 'Email', language_code: 'es', country_code: 'ES', region: 'Madrid',    postal_code: '28003', date_of_birth: '1984-01-30', gender: 'F', company_name: 'Martin SL', job_title: 'Manager', policy_number: 'POL-ct12', policy_type: 'premium',  policy_status: 'active', policy_start_date: '2023-01-01', policy_end_date: '2025-01-01', premium_amount: 2800, risk_score: 2, gdpr_consent: true, gdpr_consent_date: '2023-01-15T10:00:00Z', marketing_opt_in: true,  sms_opt_in: true,  push_opt_in: true,  last_login_at: '2024-04-12T08:00:00Z', last_purchase_at: '2024-03-01T10:00:00Z', lifetime_value: 8400,  nps_score: 9, segment_code: 'PLATINUM', crm_source: 'salesforce', external_id: 'EXT-ct12', notes: null, contact_created_at: '2022-01-01T00:00:00Z', contact_updated_at: '2024-04-15T00:00:00Z' },
  { contact_id: 'ct13', first_name: 'Kevin',  last_name: 'Moore',  email: 'kevin@example.com',  phone: '+34600000013', active: true,  secondary_email: null, secondary_phone: null, preferred_channel: 'SMS',   language_code: 'es', country_code: 'ES', region: 'Zaragoza',  postal_code: '50001', date_of_birth: '1980-07-17', gender: 'M', company_name: null, job_title: null, policy_number: 'POL-ct13', policy_type: 'standard', policy_status: 'active', policy_start_date: '2023-01-01', policy_end_date: '2025-01-01', premium_amount: 1200, risk_score: 3, gdpr_consent: true, gdpr_consent_date: '2023-01-15T10:00:00Z', marketing_opt_in: true,  sms_opt_in: true,  push_opt_in: false, last_login_at: '2024-03-10T07:30:00Z', last_purchase_at: '2024-02-05T11:00:00Z', lifetime_value: 3600,  nps_score: 7, segment_code: 'GOLD',     crm_source: 'salesforce', external_id: 'EXT-ct13', notes: null, contact_created_at: '2022-05-01T00:00:00Z', contact_updated_at: '2024-04-15T00:00:00Z' },
  { contact_id: 'ct14', first_name: 'Laura',  last_name: 'Nelson', email: 'laura@example.com',  phone: '+34600000014', active: false, secondary_email: null, secondary_phone: null, preferred_channel: 'Email', language_code: 'en', country_code: 'AU', region: 'Sydney',    postal_code: '2000',  date_of_birth: '1996-03-09', gender: 'F', company_name: null, job_title: null, policy_number: 'POL-ct14', policy_type: 'basic',    policy_status: 'lapsed', policy_start_date: '2021-01-01', policy_end_date: '2023-01-01', premium_amount: 700,  risk_score: 4, gdpr_consent: true, gdpr_consent_date: '2021-01-10T10:00:00Z', marketing_opt_in: false, sms_opt_in: false, push_opt_in: false, last_login_at: '2023-01-15T00:00:00Z', last_purchase_at: '2022-11-01T00:00:00Z', lifetime_value: 1400,  nps_score: 4, segment_code: 'BRONZE',   crm_source: 'manual',     external_id: 'EXT-ct14', notes: null, contact_created_at: '2020-06-01T00:00:00Z', contact_updated_at: '2023-01-16T00:00:00Z' },
  { contact_id: 'ct15', first_name: 'Miguel', last_name: 'Ortega', email: 'miguel@example.com', phone: '+34600000015', active: true,  secondary_email: null, secondary_phone: null, preferred_channel: 'Email', language_code: 'es', country_code: 'ES', region: 'Málaga',    postal_code: '29001', date_of_birth: '1986-12-03', gender: 'M', company_name: null, job_title: null, policy_number: 'POL-ct15', policy_type: 'standard', policy_status: 'active', policy_start_date: '2023-01-01', policy_end_date: '2025-01-01', premium_amount: 1100, risk_score: 3, gdpr_consent: true, gdpr_consent_date: '2023-01-15T10:00:00Z', marketing_opt_in: true,  sms_opt_in: false, push_opt_in: true,  last_login_at: '2024-01-20T08:00:00Z', last_purchase_at: '2024-01-05T10:00:00Z', lifetime_value: 2200,  nps_score: 6, segment_code: 'SILVER',   crm_source: 'hubspot',    external_id: 'EXT-ct15', notes: null, contact_created_at: '2022-09-01T00:00:00Z', contact_updated_at: '2024-04-10T00:00:00Z' },
  { contact_id: 'ct16', first_name: 'Nora',   last_name: 'Parker', email: 'nora@example.com',   phone: '+34600000016', active: true,  secondary_email: null, secondary_phone: null, preferred_channel: 'Push',  language_code: 'es', country_code: 'ES', region: 'Madrid',    postal_code: '28004', date_of_birth: '2000-06-22', gender: 'F', company_name: null, job_title: null, policy_number: 'POL-ct16', policy_type: 'basic',    policy_status: 'active', policy_start_date: '2024-01-01', policy_end_date: '2026-01-01', premium_amount: 600,  risk_score: 3, gdpr_consent: true, gdpr_consent_date: '2024-01-05T10:00:00Z', marketing_opt_in: true,  sms_opt_in: false, push_opt_in: true,  last_login_at: '2024-04-08T09:00:00Z', last_purchase_at: '2024-03-20T11:00:00Z', lifetime_value: 600,   nps_score: 8, segment_code: 'BRONZE',   crm_source: 'api',        external_id: 'EXT-ct16', notes: null, contact_created_at: '2024-01-01T00:00:00Z', contact_updated_at: '2024-04-15T00:00:00Z' },
  // ─ Contact with no campaign_member → should NOT appear in JOIN result ───
  { contact_id: 'ct98', first_name: 'Orphan', last_name: 'Contact', email: 'orphan@example.com', phone: '+34600000098', active: true, secondary_email: null, secondary_phone: null, preferred_channel: 'Email', language_code: 'es', country_code: 'ES', region: 'Madrid', postal_code: '28001', date_of_birth: '1990-01-01', gender: 'U', company_name: null, job_title: null, policy_number: 'POL-ct98', policy_type: 'basic', policy_status: 'active', policy_start_date: '2024-01-01', policy_end_date: '2026-01-01', premium_amount: 500, risk_score: 3, gdpr_consent: true, gdpr_consent_date: '2024-01-05T10:00:00Z', marketing_opt_in: true, sms_opt_in: false, push_opt_in: false, last_login_at: '2024-01-01T00:00:00Z', last_purchase_at: '2024-01-01T00:00:00Z', lifetime_value: 500, nps_score: 7, segment_code: 'BRONZE', crm_source: 'manual', external_id: 'EXT-ct98', notes: null, contact_created_at: '2024-01-01T00:00:00Z', contact_updated_at: '2024-01-01T00:00:00Z' },
];

// ── In-memory JOIN: mirrors exactly the query used by the handler ──────────
// SELECT cm.*, c.* FROM campaign_members cm
// JOIN contacts c ON cm.contact_id = c.contact_id
// WHERE cm.campaign_id = ? AND c.active = true
export function executeJoin(campaignId: string): any[] {
  const contactsMap = new Map(CONTACTS_TABLE.map(c => [c.contact_id, c]));

  return CAMPAIGN_MEMBERS_TABLE
    .filter(cm => cm.campaign_id === campaignId)
    .reduce<any[]>((acc, cm) => {
      const contact = contactsMap.get(cm.contact_id);
      if (contact && contact.active === true) {
        acc.push({ ...cm, ...contact });
      }
      return acc;
    }, []);
}

// ── Exported function to validate the JOIN from the simulator ──────────────
// Pass the actual rows returned by conn.execute() to compare against the
// reference result of executeJoin(). Throws if they don't match.
export function validateQuery(campaignId: string, actualRows: any[]): void {
  const members     = CAMPAIGN_MEMBERS_TABLE.filter(cm => cm.campaign_id === campaignId);
  const expected    = executeJoin(campaignId);
  const skipped     = members.filter(cm => !expected.find(r => r.member_id === cm.member_id));

  const actualIds   = actualRows.map(r => r.member_id).sort();
  const expectedIds = expected.map(r => r.member_id).sort();
  const passed      = JSON.stringify(actualIds) === JSON.stringify(expectedIds);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(` JOIN validation — campaignId: ${campaignId}`);
  console.log(`${'─'.repeat(60)}`);
  console.log(` campaign_members rows   : ${members.length}`);
  console.log(` expected (JOIN+active)  : ${expected.length}`);
  console.log(` actual (query returned) : ${actualRows.length}`);
  console.log(` excluded (no match / inactive):`);
  for (const cm of skipped) {
    const contact = CONTACTS_TABLE.find(c => c.contact_id === cm.contact_id);
    const reason  = !contact ? 'no matching contact (orphan member)' : `contact active=${contact.active}`;
    console.log(`   ✗ member_id=${cm.member_id} contact_id=${cm.contact_id} → ${reason}`);
  }
  console.log(` included rows:`);
  for (const row of expected) {
    console.log(`   ✓ member_id=${row.member_id} contact_id=${row.contact_id} name="${row.first_name} ${row.last_name}" active=${row.active} opted_out=${row.opted_out}`);
  }

  if (!passed) {
    const extra   = actualIds.filter(id => !expectedIds.includes(id));
    const missing = expectedIds.filter(id => !actualIds.includes(id));
    const lines: string[] = [`JOIN validation FAILED for campaignId=${campaignId}`];
    if (extra.length)   lines.push(`  extra rows (should have been filtered): ${extra.join(', ')}`);
    if (missing.length) lines.push(`  missing rows: ${missing.join(', ')}`);
    console.error(`${'─'.repeat(60)}`);
    lines.forEach(l => console.error(` ❌ ${l}`));
    console.error(`${'─'.repeat(60)}\n`);
    throw new Error(lines.join('\n'));
  }

  console.log(` ✅ JOIN result matches expected rows`);
  console.log(`${'─'.repeat(60)}\n`);
}

// ── Log of every conn.execute() call (sql + rows returned) ─────────────────
export const executeLog: Array<{ sql: string; params: any[]; rows: any[] }> = [];

// ── SQL-aware execute: parses key clauses so bad queries produce wrong results ──
function executeSqlAware(sql: string, params: any[]): any[] {
  const campaignId = params[0] as string;

  // Detect missing ? placeholder (SQL injection risk: campaignId not parameterized)
  const isParameterized = /where\b[^;]*\?\s*(and|$|order|limit|group)/i.test(sql) ||
                          /where\b[^;]*\?/i.test(sql);

  // Detect missing JOIN with contacts
  const hasJoin = /join\s+contacts/i.test(sql);

  // Detect missing active filter
  const hasActiveFilter = /c\.active\s*=\s*true/i.test(sql);

  if (!isParameterized) {
    console.warn(`  [DB] ⚠ WARNING: campaignId not parameterized (SQL injection risk)`);
  }

  const contactsMap = new Map(CONTACTS_TABLE.map(c => [c.contact_id, c]));

  return CAMPAIGN_MEMBERS_TABLE
    .filter(cm => cm.campaign_id === campaignId)
    .reduce<any[]>((acc, cm) => {
      const contact = contactsMap.get(cm.contact_id);
      if (!contact) return acc;                    // orphan member — always excluded
      if (!hasJoin) {
        // No JOIN: return only campaign_member columns (no contact data)
        acc.push({ ...cm });
      } else if (hasActiveFilter && !contact.active) {
        // Has active filter but contact is inactive → exclude
        return acc;
      } else {
        acc.push({ ...cm, ...contact });
      }
      return acc;
    }, []);
}

export const mysqlMock = {
  createConnection: async (_config: any) => ({
    execute: async (sql: string, params: any[]) => {
      const rows = executeSqlAware(sql, params);
      executeLog.push({ sql, params: [...params], rows: [...rows] });
      // Simulate DB query latency
      await new Promise(resolve => setTimeout(resolve, DB_QUERY_DELAY_MS));
      console.log(`  [DB] JOIN campaignId=${params[0]} → ${rows.length} row(s) (${DB_QUERY_DELAY_MS}ms)`);
      return [rows];
    },
    end: async () => { /* no-op */ },
  }),
};

// ─── Outpulse client mock ──────────────────────────────────────────────────

let callCount = 0;

export const outpulseClientMock = {
  submit: async (payload: any): Promise<void> => {
    callCount++;
    // Simulate a rate-limit on the 2nd call to test exponential backoff retry
    if (callCount === 2) {
      console.log(`  [Outpulse] RateLimitError → will retry (call #${callCount})`);
      callCount = 0; // reset so the retry succeeds
      throw new (global as any).RateLimitError('Simulated rate limit');
    }
    console.log(`  [Outpulse] submitted campaignId=${payload.campaignId} contacts=${payload.contacts.length}`);
  },
};
