
-- Add remaining constraints that don't exist yet, using CREATE UNIQUE INDEX IF NOT EXISTS
CREATE UNIQUE INDEX IF NOT EXISTS crm_contacts_crelate_id_key ON crm_contacts (crelate_id);
CREATE UNIQUE INDEX IF NOT EXISTS crm_companies_crelate_id_key ON crm_companies (crelate_id);
CREATE UNIQUE INDEX IF NOT EXISTS crm_jobs_crelate_id_key ON crm_jobs (crelate_id);
CREATE UNIQUE INDEX IF NOT EXISTS crm_placements_crelate_id_key ON crm_placements (crelate_id);
CREATE UNIQUE INDEX IF NOT EXISTS crm_activities_crelate_id_key ON crm_activities (crelate_id);
CREATE UNIQUE INDEX IF NOT EXISTS crm_contact_emails_crelate_id_key ON crm_contact_emails (crelate_id);
CREATE UNIQUE INDEX IF NOT EXISTS crm_contact_phones_crelate_id_key ON crm_contact_phones (crelate_id);
CREATE UNIQUE INDEX IF NOT EXISTS crm_contact_urls_crelate_id_key ON crm_contact_urls (crelate_id);
CREATE UNIQUE INDEX IF NOT EXISTS crm_addresses_crelate_id_key ON crm_addresses (crelate_id);
