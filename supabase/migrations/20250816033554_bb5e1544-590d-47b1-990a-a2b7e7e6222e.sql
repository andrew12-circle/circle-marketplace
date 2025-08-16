-- Set up cron job to run health monitoring every 2 minutes
SELECT cron.schedule(
  'health-monitoring',
  '*/2 * * * *', -- Every 2 minutes
  $$
  SELECT
    net.http_post(
        url:='https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/monitor-health',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloenl1eWZhd2Fwd2VhbXF6emxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTA4MTcsImV4cCI6MjA2OTMyNjgxN30.0JJSfqwd1lwI0KB5vcex_xqO-YoTfcaU95HtX9nyl_s"}'::jsonb,
        body:='{"source": "cron_health_check"}'::jsonb
    ) as request_id;
  $$
);