DROP POLICY IF EXISTS "Service role can insert gmail connections" ON public.gmail_connections;
DROP POLICY IF EXISTS "Service role can insert google calendar connections" ON public.google_calendar_connections;

CREATE POLICY "auth users can insert gmail connections"
  ON public.gmail_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auth users can insert google calendar connections"
  ON public.google_calendar_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);