
CREATE TABLE public.crm_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  records_synced integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_by uuid,
  metadata jsonb
);

ALTER TABLE public.crm_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm: auth read sync_log" ON public.crm_sync_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "crm: staff write sync_log" ON public.crm_sync_log
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
