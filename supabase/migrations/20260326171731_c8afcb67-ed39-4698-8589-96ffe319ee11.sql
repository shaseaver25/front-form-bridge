
CREATE TABLE IF NOT EXISTS public.profile_synthesis_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  synthesized_at timestamptz NOT NULL DEFAULT now(),
  synthesized_by uuid,
  fields_updated text[] DEFAULT '{}',
  source_stakeholder_count integer DEFAULT 0,
  notes text
);

ALTER TABLE public.profile_synthesis_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users can manage profile_synthesis_log"
  ON public.profile_synthesis_log
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
