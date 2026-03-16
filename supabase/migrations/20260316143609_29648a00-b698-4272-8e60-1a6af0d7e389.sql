
-- Support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  page_url TEXT,
  description TEXT NOT NULL,
  ai_response TEXT,
  ai_resolved BOOLEAN NOT NULL DEFAULT false,
  severity TEXT DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can read their own tickets
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Admins can update tickets
CREATE POLICY "Admins can update tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role inserts (from edge function) bypass RLS, but allow user insert too
CREATE POLICY "Users can insert own tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Escalation queue table
CREATE TABLE public.escalation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  support_ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  issue_summary TEXT NOT NULL,
  affected_area TEXT,
  page_url TEXT,
  details JSONB,
  severity TEXT DEFAULT 'medium',
  proposed_fix TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  assigned_to TEXT,
  webhook_sent BOOLEAN DEFAULT false,
  webhook_response_code INTEGER,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.escalation_queue ENABLE ROW LEVEL SECURITY;

-- Admins can view all escalations
CREATE POLICY "Admins can view escalations"
  ON public.escalation_queue FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update escalations
CREATE POLICY "Admins can update escalations"
  ON public.escalation_queue FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow authenticated insert (edge function uses service role, but just in case)
CREATE POLICY "Users can insert escalations"
  ON public.escalation_queue FOR INSERT
  TO authenticated
  WITH CHECK (customer_user_id = auth.uid());
