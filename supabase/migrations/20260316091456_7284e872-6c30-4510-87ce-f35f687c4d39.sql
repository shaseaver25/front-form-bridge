
-- Table for client chapter reflections
CREATE TABLE public.rebrand_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chapter_id text NOT NULL,
  question_key text NOT NULL,
  response_html text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id, question_key)
);

ALTER TABLE public.rebrand_reflections ENABLE ROW LEVEL SECURITY;

-- Clients can only see/manage their own reflections
CREATE POLICY "Users can manage own reflections"
  ON public.rebrand_reflections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins (coaches) can read all reflections
CREATE POLICY "Admins can read all reflections"
  ON public.rebrand_reflections FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_rebrand_reflections_updated_at
  BEFORE UPDATE ON public.rebrand_reflections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
