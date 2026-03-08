
-- =============================================
-- FIX: Convert all CRM restrictive policies to permissive
-- The existing policies are RESTRICTIVE (created with AS RESTRICTIVE),
-- which means they can only narrow access, not grant it.
-- Without any PERMISSIVE policy, no rows are ever returned.
-- =============================================

-- crm_contacts
DROP POLICY IF EXISTS "crm: auth read contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "crm: staff write contacts" ON public.crm_contacts;
CREATE POLICY "crm: auth read contacts" ON public.crm_contacts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write contacts" ON public.crm_contacts FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_companies
DROP POLICY IF EXISTS "crm: auth read companies" ON public.crm_companies;
DROP POLICY IF EXISTS "crm: staff write companies" ON public.crm_companies;
CREATE POLICY "crm: auth read companies" ON public.crm_companies FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write companies" ON public.crm_companies FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_activities
DROP POLICY IF EXISTS "crm: auth read activities" ON public.crm_activities;
DROP POLICY IF EXISTS "crm: staff write activities" ON public.crm_activities;
CREATE POLICY "crm: auth read activities" ON public.crm_activities FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write activities" ON public.crm_activities FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_addresses
DROP POLICY IF EXISTS "crm: auth read addresses" ON public.crm_addresses;
DROP POLICY IF EXISTS "crm: staff write addresses" ON public.crm_addresses;
CREATE POLICY "crm: auth read addresses" ON public.crm_addresses FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write addresses" ON public.crm_addresses FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_career_history
DROP POLICY IF EXISTS "crm: auth read career" ON public.crm_career_history;
DROP POLICY IF EXISTS "crm: staff write career" ON public.crm_career_history;
CREATE POLICY "crm: auth read career" ON public.crm_career_history FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write career" ON public.crm_career_history FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_contact_documents
DROP POLICY IF EXISTS "crm: auth read contact_documents" ON public.crm_contact_documents;
DROP POLICY IF EXISTS "crm: staff write contact_documents" ON public.crm_contact_documents;
CREATE POLICY "crm: auth read contact_documents" ON public.crm_contact_documents FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write contact_documents" ON public.crm_contact_documents FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_contact_emails
DROP POLICY IF EXISTS "crm: auth read emails" ON public.crm_contact_emails;
DROP POLICY IF EXISTS "crm: staff write emails" ON public.crm_contact_emails;
CREATE POLICY "crm: auth read emails" ON public.crm_contact_emails FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write emails" ON public.crm_contact_emails FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_contact_notes
DROP POLICY IF EXISTS "crm: auth read contact_notes" ON public.crm_contact_notes;
DROP POLICY IF EXISTS "crm: staff write contact_notes" ON public.crm_contact_notes;
CREATE POLICY "crm: auth read contact_notes" ON public.crm_contact_notes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write contact_notes" ON public.crm_contact_notes FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_contact_phones
DROP POLICY IF EXISTS "crm: auth read phones" ON public.crm_contact_phones;
DROP POLICY IF EXISTS "crm: staff write phones" ON public.crm_contact_phones;
CREATE POLICY "crm: auth read phones" ON public.crm_contact_phones FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write phones" ON public.crm_contact_phones FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_contact_sources
DROP POLICY IF EXISTS "crm: auth read sources" ON public.crm_contact_sources;
DROP POLICY IF EXISTS "crm: staff write sources" ON public.crm_contact_sources;
CREATE POLICY "crm: auth read sources" ON public.crm_contact_sources FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write sources" ON public.crm_contact_sources FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_contact_tags
DROP POLICY IF EXISTS "crm: auth read contact_tags" ON public.crm_contact_tags;
DROP POLICY IF EXISTS "crm: staff write contact_tags" ON public.crm_contact_tags;
CREATE POLICY "crm: auth read contact_tags" ON public.crm_contact_tags FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write contact_tags" ON public.crm_contact_tags FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_contact_urls
DROP POLICY IF EXISTS "crm: auth read urls" ON public.crm_contact_urls;
DROP POLICY IF EXISTS "crm: staff write urls" ON public.crm_contact_urls;
CREATE POLICY "crm: auth read urls" ON public.crm_contact_urls FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write urls" ON public.crm_contact_urls FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_jobs
DROP POLICY IF EXISTS "crm: auth read jobs" ON public.crm_jobs;
DROP POLICY IF EXISTS "crm: staff write jobs" ON public.crm_jobs;
CREATE POLICY "crm: auth read jobs" ON public.crm_jobs FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write jobs" ON public.crm_jobs FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_pipeline_items
DROP POLICY IF EXISTS "crm: auth read pipeline" ON public.crm_pipeline_items;
DROP POLICY IF EXISTS "crm: staff write pipeline" ON public.crm_pipeline_items;
CREATE POLICY "crm: auth read pipeline" ON public.crm_pipeline_items FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write pipeline" ON public.crm_pipeline_items FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_placements
DROP POLICY IF EXISTS "crm: auth read placements" ON public.crm_placements;
DROP POLICY IF EXISTS "crm: staff write placements" ON public.crm_placements;
CREATE POLICY "crm: auth read placements" ON public.crm_placements FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write placements" ON public.crm_placements FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_tags
DROP POLICY IF EXISTS "crm: auth read tags" ON public.crm_tags;
DROP POLICY IF EXISTS "crm: staff write tags" ON public.crm_tags;
CREATE POLICY "crm: auth read tags" ON public.crm_tags FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write tags" ON public.crm_tags FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_sync_log
DROP POLICY IF EXISTS "crm: auth read sync_log" ON public.crm_sync_log;
DROP POLICY IF EXISTS "crm: staff write sync_log" ON public.crm_sync_log;
CREATE POLICY "crm: auth read sync_log" ON public.crm_sync_log FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "crm: staff write sync_log" ON public.crm_sync_log FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- crm_migration_log
DROP POLICY IF EXISTS "crm: admin migration log" ON public.crm_migration_log;
CREATE POLICY "crm: admin migration log" ON public.crm_migration_log FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- user_profiles: ensure all policies are permissive too
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.user_profiles;
CREATE POLICY "Authenticated users can read profiles" ON public.user_profiles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can manage profiles" ON public.user_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles: ensure readable by authenticated, manageable by admin
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Authenticated users can read roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Auto-assign 'user' role to new signups
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
