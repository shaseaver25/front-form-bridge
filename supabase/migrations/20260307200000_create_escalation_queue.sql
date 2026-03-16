-- Create escalation_queue table for Chip triage system
CREATE TABLE public.escalation_queue (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  issue_summary     TEXT NOT NULL,
  affected_area     TEXT,
  page_url          TEXT,
  details           JSONB DEFAULT '{}',
  severity          TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low','medium','high','critical')),
  proposed_fix      TEXT,
  status            TEXT NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN ('pending_approval','approved','rejected','applied','auto_fixed')),
  customer_user_id  UUID,
  assigned_to       TEXT DEFAULT 'shannon@tailoredu.org',
  admin_response    TEXT,
  approved_at       TIMESTAMPTZ,
  rejected_at       TIMESTAMPTZ,
  applied_at        TIMESTAMPTZ,
  webhook_sent      BOOLEAN DEFAULT FALSE,
  webhook_response_code INTEGER,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_escalation_queue_status ON public.escalation_queue(status);
CREATE INDEX idx_escalation_queue_customer ON public.escalation_queue(customer_user_id);
CREATE INDEX idx_escalation_queue_created ON public.escalation_queue(created_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_escalation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_escalation_updated_at
  BEFORE UPDATE ON public.escalation_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_escalation_updated_at();

-- Row Level Security
ALTER TABLE public.escalation_queue ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on escalation_queue"
  ON public.escalation_queue
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Users can read their own escalations
CREATE POLICY "Users read own escalations"
  ON public.escalation_queue
  FOR SELECT
  USING (customer_user_id = auth.uid());

-- Service role / edge functions can insert (for chip-triage function)
CREATE POLICY "Service insert escalations"
  ON public.escalation_queue
  FOR INSERT
  WITH CHECK (true);
