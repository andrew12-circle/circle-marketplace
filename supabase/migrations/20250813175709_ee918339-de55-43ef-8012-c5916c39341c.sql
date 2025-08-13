-- Set up cron job for daily blessing (requires pg_cron extension)
-- First enable the extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily blessing at 6 AM UTC
SELECT cron.schedule(
  'daily-blessing-6am',
  '0 6 * * *', -- 6 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/daily-blessing',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloenl1eWZhd2Fwd2VhbXF6emxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTA4MTcsImV4cCI6MjA2OTMyNjgxN30.0JJSfqwd1lwI0KB5vcex_xqO-YoTfcaU95HtX9nyl_s"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);