-- Enable pg_cron and pg_net extensions for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the auto-import function to run every 6 hours
SELECT cron.schedule(
  'auto-import-trending-content',
  '0 */6 * * *', -- Every 6 hours at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/auto-import-trending',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloenl1eWZhd2Fwd2VhbXF6emxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTA4MTcsImV4cCI6MjA2OTMyNjgxN30.0JJSfqwd1lwI0KB5vcex_xqO-YoTfcaU95HtX9nyl_s"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Create a function to manually trigger the import (for testing)
CREATE OR REPLACE FUNCTION trigger_trending_import()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/auto-import-trending',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloenl1eWZhd2Fwd2VhbXF6emxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTA4MTcsImV4cCI6MjA2OTMyNjgxN30.0JJSfqwd1lwI0QB5vcex_xqO-YoTfcaU95HtX9nyl_s"}'::jsonb,
    body := '{"manual_trigger": true}'::jsonb
  );
END;
$$;