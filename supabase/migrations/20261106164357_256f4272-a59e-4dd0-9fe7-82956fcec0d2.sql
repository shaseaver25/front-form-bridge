CREATE OR REPLACE FUNCTION public.is_internal_crm_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT _user_id = auth.uid()
    AND NOT public.has_role(_user_id, 'client'::public.app_role)
    AND (public.has_role(_user_id, 'admin'::public.app_role)
      OR public.has_role(_user_id, 'moderator'::public.app_role));
$$;
REVOKE ALL ON FUNCTION public.is_internal_crm_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_internal_crm_staff(uuid) TO authenticated, service_role;

ALTER POLICY "Authenticated users can view collaborators" ON public.project_collaborators
USING (public.is_internal_crm_staff(auth.uid()));
CREATE POLICY "Internal staff boundary for collaborators" ON public.project_collaborators
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_internal_crm_staff(auth.uid()))
WITH CHECK (public.is_internal_crm_staff(auth.uid()));

ALTER POLICY "Authenticated users can view tasks" ON public.unified_tasks
USING (public.is_internal_crm_staff(auth.uid()));
CREATE POLICY "Internal staff boundary for tasks" ON public.unified_tasks
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_internal_crm_staff(auth.uid()))
WITH CHECK (public.is_internal_crm_staff(auth.uid()));

ALTER POLICY "Authenticated users can view contact documents" ON storage.objects
USING (
  bucket_id = 'contact-documents'
  AND public.is_internal_crm_staff(auth.uid())
  AND (
    EXISTS (SELECT 1 FROM public.crm_contact_documents cd WHERE cd.file_url = objects.name)
    OR EXISTS (SELECT 1 FROM public.crm_attachments ca WHERE ca.storage_path = objects.name)
  )
);
ALTER POLICY "Authenticated users can delete contact documents" ON storage.objects
USING (
  bucket_id = 'contact-documents'
  AND public.is_internal_crm_staff(auth.uid())
  AND (
    EXISTS (SELECT 1 FROM public.crm_contact_documents cd WHERE cd.file_url = objects.name)
    OR EXISTS (SELECT 1 FROM public.crm_attachments ca WHERE ca.storage_path = objects.name)
  )
);
ALTER POLICY "Auth users can upload contact docs" ON storage.objects
WITH CHECK (bucket_id = 'contact-documents' AND public.is_internal_crm_staff(auth.uid()));
CREATE POLICY "Internal staff boundary for contact storage" ON storage.objects
AS RESTRICTIVE FOR ALL TO authenticated
USING (bucket_id <> 'contact-documents' OR public.is_internal_crm_staff(auth.uid()))
WITH CHECK (bucket_id <> 'contact-documents' OR public.is_internal_crm_staff(auth.uid()));

DO $$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['project_collaborators', 'unified_tasks'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = target AND cmd = 'SELECT' AND qual LIKE '%is_internal_crm_staff%') THEN
      RAISE EXCEPTION 'Staff read boundary missing on %', target;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = target AND cmd IN ('SELECT', 'ALL') AND qual = 'true') THEN
      RAISE EXCEPTION 'Unrestricted read policy remains on %', target;
    END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can view contact documents' AND qual LIKE '%is_internal_crm_staff%' AND qual NOT LIKE '%~~%') THEN
    RAISE EXCEPTION 'Contact storage exact-match staff boundary missing';
  END IF;
END;
$$;