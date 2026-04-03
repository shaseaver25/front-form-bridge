
ALTER TABLE public.crm_companies DROP CONSTRAINT crm_companies_status_check;

ALTER TABLE public.crm_companies ADD CONSTRAINT crm_companies_status_check
  CHECK (status = ANY (ARRAY[
    'active', 'inactive', 'prospect', 'client', 'archived',
    'identified', 'screening', 'presented', 'interview', 'offer', 'placed'
  ]));
