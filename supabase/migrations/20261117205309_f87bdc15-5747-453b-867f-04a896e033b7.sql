DO $$
DECLARE r record; tbls text[] := ARRAY['crm_jobs','crm_contact_emails','crm_job_tags','crm_attachments','email_campaigns','board_members','email_contacts','discovery_stakeholders','email_segments','crm_companies','board_card_comments','discovery_transcripts','board_card_subtasks','crm_contact_tags','crm_addresses','crm_contact_notes','board_time_logs','email_sequences','crm_activities','company_profiles','crm_placements','crm_career_history','email_sequence_enrollments','crm_company_tags','crm_form_fields','board_card_dependencies','crm_contact_documents','crm_contact_phones','board_columns','crm_migration_log','crm_contact_sources','crm_sync_log','board_card_activity','crm_contact_urls','crm_contacts','crm_connections','board_automations','crm_tags','crm_pipeline_items','boards','board_cards','profile_synthesis_log'];
  staff text := 'public.is_internal_crm_staff(auth.uid())';
BEGIN
  FOR r IN SELECT tablename, policyname, qual, with_check FROM pg_policies
    WHERE schemaname='public' AND tablename = ANY(tbls)
      AND (qual = '(auth.uid() IS NOT NULL)' OR with_check = '(auth.uid() IS NOT NULL)')
  LOOP
    IF r.qual = '(auth.uid() IS NOT NULL)' THEN
      EXECUTE format('ALTER POLICY %I ON public.%I USING (%s)', r.policyname, r.tablename, staff);
    END IF;
    IF r.with_check = '(auth.uid() IS NOT NULL)' THEN
      EXECUTE format('ALTER POLICY %I ON public.%I WITH CHECK (%s)', r.policyname, r.tablename, staff);
    END IF;
  END LOOP;
END $$;

ALTER POLICY "Authenticated users can read profiles" ON public.user_profiles
  USING (auth.uid() = id OR public.is_internal_crm_staff(auth.uid()));
ALTER POLICY "Authenticated users can read roles" ON public.user_roles
  USING (auth.uid() = user_id OR public.is_internal_crm_staff(auth.uid()));