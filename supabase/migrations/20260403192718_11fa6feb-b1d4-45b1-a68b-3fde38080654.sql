-- 1. Enable RLS on tables missing it
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_connections ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS policies for company_profiles
CREATE POLICY "auth users can read company_profiles"
  ON public.company_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth users can manage company_profiles"
  ON public.company_profiles FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Add RLS policies for discovery_stakeholders
CREATE POLICY "auth users can read discovery_stakeholders"
  ON public.discovery_stakeholders FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth users can manage discovery_stakeholders"
  ON public.discovery_stakeholders FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Add RLS policies for discovery_transcripts
CREATE POLICY "auth users can read discovery_transcripts"
  ON public.discovery_transcripts FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth users can manage discovery_transcripts"
  ON public.discovery_transcripts FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Add RLS policies for crm_connections
CREATE POLICY "auth users can read crm_connections"
  ON public.crm_connections FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth users can manage crm_connections"
  ON public.crm_connections FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Drop overly permissive gmail/calendar policies (service role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role can manage gmail messages" ON public.gmail_messages;
DROP POLICY IF EXISTS "Service role can manage calendar events" ON public.google_calendar_events;

-- 7. Fix storage policies for contact-documents bucket
DROP POLICY IF EXISTS "Authenticated users can view contact documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete contact documents" ON storage.objects;

CREATE POLICY "Authenticated users can view contact documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contact-documents'
    AND EXISTS (
      SELECT 1 FROM public.crm_contact_documents cd
      WHERE cd.file_url LIKE '%' || name
    )
  );

CREATE POLICY "Authenticated users can delete contact documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contact-documents'
    AND EXISTS (
      SELECT 1 FROM public.crm_contact_documents cd
      WHERE cd.file_url LIKE '%' || name
    )
  );