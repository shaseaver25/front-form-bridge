-- Create support_tickets table (must exist before escalation_queue FK reference)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  page_url    TEXT,
  description TEXT,
  ai_response TEXT,
  ai_resolved BOOLEAN DEFAULT FALSE,
  severity    TEXT NOT NULL DEFAULT 'low'
    CHECK (severity IN ('low','medium','high','critical')),
  status      TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved')),
  admin_notes TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_created ON public.support_tickets(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_support_tickets_updated_at();

-- Row Level Security
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins full access on support_tickets"
  ON public.support_tickets
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Users read own tickets
CREATE POLICY "Users read own support_tickets"
  ON public.support_tickets
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role / edge functions can insert
CREATE POLICY "Service insert support_tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (true);
