-- Enable RLS on email tables
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_contacts ENABLE ROW LEVEL SECURITY;

-- Staff-only policies for email_campaigns
CREATE POLICY "staff manage email_campaigns" ON email_campaigns
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Staff-only policies for email_segments
CREATE POLICY "staff manage email_segments" ON email_segments
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Staff-only policies for email_sequences
CREATE POLICY "staff manage email_sequences" ON email_sequences
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Staff-only policies for email_sequence_enrollments
CREATE POLICY "staff manage email_sequence_enrollments" ON email_sequence_enrollments
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Staff-only policies for email_contacts
CREATE POLICY "staff manage email_contacts" ON email_contacts
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);