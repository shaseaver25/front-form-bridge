
-- Add birthday column to crm_contacts
ALTER TABLE public.crm_contacts ADD COLUMN birthday date NULL;

-- Create form_fields table for interview/screening questions
CREATE TABLE public.crm_form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crelate_id text UNIQUE,
  value text NOT NULL,
  field_type text NOT NULL DEFAULT 'short_answer',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.crm_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm: auth read form_fields" ON public.crm_form_fields
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "crm: staff write form_fields" ON public.crm_form_fields
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
