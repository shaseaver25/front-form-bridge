
ALTER TABLE public.crm_contact_documents 
ADD COLUMN IF NOT EXISTS crelate_id text UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_crm_contact_documents_crelate_id 
ON public.crm_contact_documents (crelate_id) WHERE crelate_id IS NOT NULL;
