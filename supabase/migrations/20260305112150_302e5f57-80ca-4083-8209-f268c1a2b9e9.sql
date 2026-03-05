
-- Contact notes table
CREATE TABLE public.crm_contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm: auth read contact_notes" ON public.crm_contact_notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "crm: staff write contact_notes" ON public.crm_contact_notes
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Contact documents table
CREATE TABLE public.crm_contact_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size_bytes integer,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_contact_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm: auth read contact_documents" ON public.crm_contact_documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "crm: staff write contact_documents" ON public.crm_contact_documents
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Storage bucket for contact documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contact-documents',
  'contact-documents',
  false,
  10485760,
  ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg','text/plain','text/csv','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- Storage policies
CREATE POLICY "Auth users can upload contact docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contact-documents');

CREATE POLICY "Auth users can read contact docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contact-documents');

CREATE POLICY "Auth users can delete contact docs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'contact-documents');
