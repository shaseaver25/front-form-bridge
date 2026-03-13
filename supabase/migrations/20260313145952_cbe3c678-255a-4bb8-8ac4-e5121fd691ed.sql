-- Company tags junction table
CREATE TABLE public.crm_company_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.crm_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (company_id, tag_id)
);

ALTER TABLE public.crm_company_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm: auth read company_tags" ON public.crm_company_tags
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "crm: staff write company_tags" ON public.crm_company_tags
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Job tags junction table
CREATE TABLE public.crm_job_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.crm_jobs(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.crm_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (job_id, tag_id)
);

ALTER TABLE public.crm_job_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm: auth read job_tags" ON public.crm_job_tags
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "crm: staff write job_tags" ON public.crm_job_tags
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Insert the "Executive Search" tag if it doesn't exist
INSERT INTO public.crm_tags (name, category) VALUES ('Executive Search', 'program') ON CONFLICT DO NOTHING;