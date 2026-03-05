-- Fix 1: Update CRM SELECT policies to require authentication (crm_contacts and crm_contact_emails)
-- Drop and recreate the overly permissive SELECT policies

DROP POLICY IF EXISTS "crm: auth read contacts" ON public.crm_contacts;
CREATE POLICY "crm: auth read contacts"
  ON public.crm_contacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm: auth read emails" ON public.crm_contact_emails;
CREATE POLICY "crm: auth read emails"
  ON public.crm_contact_emails
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
