
ALTER TABLE public.crm_contact_notes
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_activity_id uuid,
  ADD COLUMN IF NOT EXISTS source_crelate_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_contact_notes_source_crelate_id
  ON public.crm_contact_notes (source_crelate_id)
  WHERE source_crelate_id IS NOT NULL;
