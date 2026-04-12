
-- Fix 1: Gmail connections - scope SELECT and UPDATE to authenticated role only
DROP POLICY IF EXISTS "Users can view own gmail connections" ON public.gmail_connections;
CREATE POLICY "Users can view own gmail connections"
  ON public.gmail_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own gmail connections" ON public.gmail_connections;
CREATE POLICY "Users can update own gmail connections"
  ON public.gmail_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix 2: Remove overly broad storage policies that override restrictive ones
DROP POLICY IF EXISTS "Auth users can read contact docs" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete contact docs" ON storage.objects;
