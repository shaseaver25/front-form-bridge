-- Google OAuth Connection Tables for Gmail and Google Calendar
-- These store OAuth tokens and connection state per user

-- Gmail Connections
CREATE TABLE IF NOT EXISTS gmail_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_active boolean DEFAULT true,
  auto_sync_enabled boolean DEFAULT false,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Google Calendar Connections
CREATE TABLE IF NOT EXISTS google_calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_active boolean DEFAULT true,
  auto_sync_enabled boolean DEFAULT false,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Synced calendar events table (for Google Calendar)
CREATE TABLE IF NOT EXISTS google_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES google_calendar_connections(id) ON DELETE CASCADE,
  google_event_id text NOT NULL,
  summary text,
  description text,
  start_time timestamptz,
  end_time timestamptz,
  attendees jsonb DEFAULT '[]',
  location text,
  html_link text,
  status text DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, google_event_id)
);

-- Synced Gmail messages metadata table
CREATE TABLE IF NOT EXISTS gmail_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES gmail_connections(id) ON DELETE CASCADE,
  gmail_message_id text NOT NULL,
  thread_id text,
  subject text,
  from_email text,
  from_name text,
  to_emails jsonb DEFAULT '[]',
  cc_emails jsonb DEFAULT '[]',
  snippet text,
  internal_date timestamptz,
  label_ids jsonb DEFAULT '[]',
  is_read boolean DEFAULT false,
  matched_contact_id uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, gmail_message_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gmail_connections_user_active
  ON gmail_connections(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gcal_connections_user_active
  ON google_calendar_connections(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_user
  ON gmail_messages(user_id, internal_date DESC);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_contact
  ON gmail_messages(matched_contact_id) WHERE matched_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gcal_events_user
  ON google_calendar_events(user_id, start_time DESC);

-- Enable RLS
ALTER TABLE gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can read/update their own connections
CREATE POLICY "Users can view own gmail connections"
  ON gmail_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own gmail connections"
  ON gmail_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert gmail connections"
  ON gmail_connections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own google calendar connections"
  ON google_calendar_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own google calendar connections"
  ON google_calendar_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert google calendar connections"
  ON google_calendar_connections FOR INSERT
  WITH CHECK (true);

-- Event/message table policies
CREATE POLICY "Users can view own calendar events"
  ON google_calendar_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage calendar events"
  ON google_calendar_events FOR ALL
  USING (true);

CREATE POLICY "Users can view own gmail messages"
  ON gmail_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage gmail messages"
  ON gmail_messages FOR ALL
  USING (true);

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gmail_connections_updated_at
  BEFORE UPDATE ON gmail_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gcal_connections_updated_at
  BEFORE UPDATE ON google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gcal_events_updated_at
  BEFORE UPDATE ON google_calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
