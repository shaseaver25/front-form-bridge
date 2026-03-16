
-- rebrand_progress
CREATE TABLE public.rebrand_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, chapter_id)
);
ALTER TABLE public.rebrand_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress" ON public.rebrand_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all progress" ON public.rebrand_progress FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- rebrand_harvests
CREATE TABLE public.rebrand_harvests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  company_name text NOT NULL,
  job_url text,
  raw_description text NOT NULL,
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  problem_language jsonb NOT NULL DEFAULT '[]'::jsonb,
  responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  qualifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  nomenclature jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rebrand_harvests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own harvests" ON public.rebrand_harvests FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all harvests" ON public.rebrand_harvests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- rebrand_gap_analysis
CREATE TABLE public.rebrand_gap_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  harvest_id uuid NOT NULL REFERENCES public.rebrand_harvests(id) ON DELETE CASCADE,
  current_term text NOT NULL,
  target_term text NOT NULL,
  status text NOT NULL DEFAULT 'unmapped',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rebrand_gap_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own gap analysis" ON public.rebrand_gap_analysis FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all gap analysis" ON public.rebrand_gap_analysis FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- rebrand_coach_notes
CREATE TABLE public.rebrand_coach_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  note_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rebrand_coach_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own coach notes" ON public.rebrand_coach_notes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all coach notes" ON public.rebrand_coach_notes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert coach notes" ON public.rebrand_coach_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger for harvests
CREATE TRIGGER update_rebrand_harvests_updated_at
  BEFORE UPDATE ON public.rebrand_harvests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
