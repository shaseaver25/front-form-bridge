
-- Boards
CREATE TABLE public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NULL,
  created_by uuid NOT NULL,
  name text NOT NULL,
  description text NULL,
  board_type text NOT NULL DEFAULT 'general',
  theme_color text NOT NULL DEFAULT 'teal',
  column_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_archived boolean NOT NULL DEFAULT false,
  archived_at timestamptz NULL,
  linked_grant_id uuid NULL,
  linked_campaign_id uuid NULL,
  linked_site_id uuid NULL,
  volunteers_needed boolean NULL DEFAULT false,
  is_board_initiative boolean NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users can read boards" ON public.boards FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth users can insert boards" ON public.boards FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth users can update boards" ON public.boards FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- Board Columns
CREATE TABLE public.board_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  column_type text NOT NULL DEFAULT 'custom',
  wip_limit integer NULL,
  is_done_column boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users can read board_columns" ON public.board_columns FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth users can insert board_columns" ON public.board_columns FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth users can update board_columns" ON public.board_columns FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth users can delete board_columns" ON public.board_columns FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Board Members
CREATE TABLE public.board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(board_id, user_id)
);

ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users can read board_members" ON public.board_members FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth users can insert board_members" ON public.board_members FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth users can update board_members" ON public.board_members FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth users can delete board_members" ON public.board_members FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Board Cards
CREATE TABLE public.board_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES public.board_columns(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  headline text NOT NULL,
  description text NULL,
  position integer NOT NULL DEFAULT 0,
  priority text NOT NULL DEFAULT 'medium',
  due_date date NULL,
  estimated_hours numeric NULL,
  actual_hours numeric NULL,
  assigned_to uuid NULL,
  question_for uuid NULL,
  linked_contact_id uuid NULL,
  linked_grant_id uuid NULL,
  linked_donation_id uuid NULL,
  linked_board_id uuid NULL,
  is_suggested boolean NOT NULL DEFAULT false,
  is_blocked boolean NOT NULL DEFAULT false,
  blocked_reason text NULL,
  completed_at timestamptz NULL,
  parent_subtask_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.board_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users can read board_cards" ON public.board_cards FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth users can insert board_cards" ON public.board_cards FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth users can update board_cards" ON public.board_cards FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth users can delete board_cards" ON public.board_cards FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Board Card Subtasks
CREATE TABLE public.board_card_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.board_cards(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz NULL,
  position integer NOT NULL DEFAULT 0,
  spawned_card_id uuid NULL REFERENCES public.board_cards(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.board_card_subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users can manage board_card_subtasks" ON public.board_card_subtasks FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Board Card Comments
CREATE TABLE public.board_card_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.board_cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.board_card_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users can manage board_card_comments" ON public.board_card_comments FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Board Card Activity
CREATE TABLE public.board_card_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.board_cards(id) ON DELETE CASCADE,
  user_id uuid NULL,
  activity_type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.board_card_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users can manage board_card_activity" ON public.board_card_activity FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Board Card Dependencies
CREATE TABLE public.board_card_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.board_cards(id) ON DELETE CASCADE,
  depends_on_card_id uuid NOT NULL REFERENCES public.board_cards(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(card_id, depends_on_card_id)
);

ALTER TABLE public.board_card_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users can manage board_card_dependencies" ON public.board_card_dependencies FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Board Time Logs
CREATE TABLE public.board_time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.board_cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NULL,
  duration_minutes integer NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.board_time_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users can manage board_time_logs" ON public.board_time_logs FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Board Automations
CREATE TABLE public.board_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_type text NOT NULL,
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.board_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users can manage board_automations" ON public.board_automations FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
