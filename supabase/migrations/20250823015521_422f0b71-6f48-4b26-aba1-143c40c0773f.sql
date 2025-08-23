-- Setup CRON job for cache warming (requires pg_cron extension)

-- Enable pg_net if not already enabled (required for HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create CRON job to warm marketplace cache every 5 minutes
SELECT cron.schedule(
  'warm-marketplace-cache-every-5min',
  '*/5 * * * *', -- Every 5 minutes
  $$
  select
    net.http_post(
        url:='https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/warm-marketplace-cache',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloenl1eWZhd2Fwd2VhbXF6emxqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzc1MDgxNywiZXhwIjoyMDY5MzI2ODE3fQ.Z-Q-2h1GdQYB_M4xvl6fhDJVKWZpHFXdaGhGYz8XO5w"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Create a cleanup job to remove old cache entries every hour
SELECT cron.schedule(
  'cleanup-marketplace-cache-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT public.cleanup_marketplace_cache();
  $$
);