-- Drop all anonymous read policies on CRM tables
DROP POLICY IF EXISTS "crm: anon read contacts" ON crm_contacts;
DROP POLICY IF EXISTS "crm: anon read contact_phones" ON crm_contact_phones;
DROP POLICY IF EXISTS "crm: anon read addresses" ON crm_addresses;
DROP POLICY IF EXISTS "crm: anon read contact_urls" ON crm_contact_urls;
DROP POLICY IF EXISTS "crm: anon read career_history" ON crm_career_history;
DROP POLICY IF EXISTS "crm: anon read activities" ON crm_activities;
DROP POLICY IF EXISTS "crm: anon read pipeline_items" ON crm_pipeline_items;
DROP POLICY IF EXISTS "crm: anon read placements" ON crm_placements;
DROP POLICY IF EXISTS "crm: anon read attachments" ON crm_attachments;
DROP POLICY IF EXISTS "crm: anon read companies" ON crm_companies;
DROP POLICY IF EXISTS "crm: anon read jobs" ON crm_jobs;
DROP POLICY IF EXISTS "crm: anon read tags" ON crm_tags;
DROP POLICY IF EXISTS "crm: anon read contact_tags" ON crm_contact_tags;
DROP POLICY IF EXISTS "crm: anon read contact_sources" ON crm_contact_sources;
DROP POLICY IF EXISTS "crm: anon read contact_emails" ON crm_contact_emails;

-- Add authenticated read policy for crm_attachments (it only had anon read, no auth read)
CREATE POLICY "crm: auth read attachments" ON crm_attachments
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);