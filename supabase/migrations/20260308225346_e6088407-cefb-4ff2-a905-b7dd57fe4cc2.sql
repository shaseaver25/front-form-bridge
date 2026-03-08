
-- Fix crm_activities policies to be PERMISSIVE
DROP POLICY IF EXISTS "crm: auth read activities" ON public.crm_activities;
CREATE POLICY "crm: auth read activities" ON public.crm_activities
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write activities" ON public.crm_activities;
CREATE POLICY "crm: staff write activities" ON public.crm_activities
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Fix all other CRM tables that may still be RESTRICTIVE
DROP POLICY IF EXISTS "crm: auth read contacts" ON public.crm_contacts;
CREATE POLICY "crm: auth read contacts" ON public.crm_contacts
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write contacts" ON public.crm_contacts;
CREATE POLICY "crm: staff write contacts" ON public.crm_contacts
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read companies" ON public.crm_companies;
CREATE POLICY "crm: auth read companies" ON public.crm_companies
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write companies" ON public.crm_companies;
CREATE POLICY "crm: staff write companies" ON public.crm_companies
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read jobs" ON public.crm_jobs;
CREATE POLICY "crm: auth read jobs" ON public.crm_jobs
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write jobs" ON public.crm_jobs;
CREATE POLICY "crm: staff write jobs" ON public.crm_jobs
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read emails" ON public.crm_contact_emails;
CREATE POLICY "crm: auth read emails" ON public.crm_contact_emails
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write emails" ON public.crm_contact_emails;
CREATE POLICY "crm: staff write emails" ON public.crm_contact_emails
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read phones" ON public.crm_contact_phones;
CREATE POLICY "crm: auth read phones" ON public.crm_contact_phones
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write phones" ON public.crm_contact_phones;
CREATE POLICY "crm: staff write phones" ON public.crm_contact_phones
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read urls" ON public.crm_contact_urls;
CREATE POLICY "crm: auth read urls" ON public.crm_contact_urls
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write urls" ON public.crm_contact_urls;
CREATE POLICY "crm: staff write urls" ON public.crm_contact_urls
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read addresses" ON public.crm_addresses;
CREATE POLICY "crm: auth read addresses" ON public.crm_addresses
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write addresses" ON public.crm_addresses;
CREATE POLICY "crm: staff write addresses" ON public.crm_addresses
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read contact_notes" ON public.crm_contact_notes;
CREATE POLICY "crm: auth read contact_notes" ON public.crm_contact_notes
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write contact_notes" ON public.crm_contact_notes;
CREATE POLICY "crm: staff write contact_notes" ON public.crm_contact_notes
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read contact_documents" ON public.crm_contact_documents;
CREATE POLICY "crm: auth read contact_documents" ON public.crm_contact_documents
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write contact_documents" ON public.crm_contact_documents;
CREATE POLICY "crm: staff write contact_documents" ON public.crm_contact_documents
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read pipeline" ON public.crm_pipeline_items;
CREATE POLICY "crm: auth read pipeline" ON public.crm_pipeline_items
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write pipeline" ON public.crm_pipeline_items;
CREATE POLICY "crm: staff write pipeline" ON public.crm_pipeline_items
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read placements" ON public.crm_placements;
CREATE POLICY "crm: auth read placements" ON public.crm_placements
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write placements" ON public.crm_placements;
CREATE POLICY "crm: staff write placements" ON public.crm_placements
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read tags" ON public.crm_tags;
CREATE POLICY "crm: auth read tags" ON public.crm_tags
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write tags" ON public.crm_tags;
CREATE POLICY "crm: staff write tags" ON public.crm_tags
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read contact_tags" ON public.crm_contact_tags;
CREATE POLICY "crm: auth read contact_tags" ON public.crm_contact_tags
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write contact_tags" ON public.crm_contact_tags;
CREATE POLICY "crm: staff write contact_tags" ON public.crm_contact_tags
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read sources" ON public.crm_contact_sources;
CREATE POLICY "crm: auth read sources" ON public.crm_contact_sources
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write sources" ON public.crm_contact_sources;
CREATE POLICY "crm: staff write sources" ON public.crm_contact_sources
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read sync_log" ON public.crm_sync_log;
CREATE POLICY "crm: auth read sync_log" ON public.crm_sync_log
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write sync_log" ON public.crm_sync_log;
CREATE POLICY "crm: staff write sync_log" ON public.crm_sync_log
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read career" ON public.crm_career_history;
CREATE POLICY "crm: auth read career" ON public.crm_career_history
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: staff write career" ON public.crm_career_history;
CREATE POLICY "crm: staff write career" ON public.crm_career_history
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: admin migration log" ON public.crm_migration_log;
CREATE POLICY "crm: admin migration log" ON public.crm_migration_log
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Fix user_profiles and user_roles too
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.user_profiles;
CREATE POLICY "Authenticated users can read profiles" ON public.user_profiles
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.user_roles;
CREATE POLICY "Authenticated users can read roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
