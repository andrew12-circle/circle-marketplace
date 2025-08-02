-- Create a cron job to send monthly statements on the 1st of each month at 9 AM
SELECT cron.schedule(
  'send-monthly-statements',
  '0 9 1 * *', -- At 9:00 AM on the 1st day of every month
  $$
  SELECT
    net.http_post(
        url:='https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/send-monthly-statement',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloenl1eWZhd2Fwd2VhbXF6emxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTA4MTcsImV4cCI6MjA2OTMyNjgxN30.0JJSfqwd1lwI0QB5vcex_xqO-YoTfcaU95HtX9nyl_s"}'::jsonb,
        body:='{"manual_trigger": false}'::jsonb
    ) as request_id;
  $$
);