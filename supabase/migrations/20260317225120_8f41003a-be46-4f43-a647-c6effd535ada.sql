SELECT cron.schedule(
  'gmail-daily-auto-sync',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rzhcefyigmkavddjjxvg.supabase.co/functions/v1/gmail-auto-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6aGNlZnlpZ21rYXZkZGpqeHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Mzg0NTYsImV4cCI6MjA4ODExNDQ1Nn0.Suwc7GAfTxv7pxVu90JEsRqI7rT5W9784RHZxmdpnFc"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);