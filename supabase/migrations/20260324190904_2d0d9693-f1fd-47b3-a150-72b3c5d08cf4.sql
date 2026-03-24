
CREATE TABLE public.project_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_type text NOT NULL DEFAULT 'board',
  project_id uuid NOT NULL,
  role text DEFAULT 'member',
  status text DEFAULT 'active',
  invited_at timestamptz DEFAULT now(),
  access_expires_at timestamptz
);

ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view collaborators"
  ON public.project_collaborators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage collaborators"
  ON public.project_collaborators FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
