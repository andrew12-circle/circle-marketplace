-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to auto-import top real estate channels every 6 hours
SELECT cron.schedule(
  'auto-import-channels-every-6-hours',
  '0 */6 * * *', -- Every 6 hours at minute 0
  $$
  SELECT
    net.http_post(
        url := 'https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/auto-import-channels',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloenl1eWZhd2Fwd2VhbXF6emxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTA4MTcsImV4cCI6MjA2OTMyNjgxN30.0JJSfqwd1lwI0KB5vcex_xqO-YoTfcaU95HtX9nyl_s"}'::jsonb,
        body := '{"automated": true}'::jsonb
    ) as request_id;
  $$
);