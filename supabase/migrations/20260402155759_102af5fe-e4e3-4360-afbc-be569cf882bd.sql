
-- Create unified_tasks table
CREATE TABLE public.unified_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'manual',
  source_id TEXT,
  source_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  constituent_id UUID,
  organization_id UUID,
  grant_opportunity_id UUID,
  estimated_time_minutes INTEGER,
  actual_time_minutes INTEGER NOT NULL DEFAULT 0,
  task_category TEXT,
  outcome_type TEXT,
  outcome_id UUID,
  outcome_amount NUMERIC,
  outcome_date DATE,
  outcome_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unified_tasks ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all tasks (team-wide visibility)
CREATE POLICY "Authenticated users can view tasks"
  ON public.unified_tasks FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create tasks
CREATE POLICY "Authenticated users can create tasks"
  ON public.unified_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update tasks they created or are assigned to
CREATE POLICY "Users can update tasks"
  ON public.unified_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = assigned_to);

-- Users can delete tasks they created
CREATE POLICY "Users can delete own tasks"
  ON public.unified_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Add updated_at trigger
CREATE TRIGGER update_unified_tasks_updated_at
  BEFORE UPDATE ON public.unified_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create task_time_entries table
CREATE TABLE public.task_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unified_task_id UUID REFERENCES public.unified_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own time entries"
  ON public.task_time_entries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
