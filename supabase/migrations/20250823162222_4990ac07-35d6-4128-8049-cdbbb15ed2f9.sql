
-- 1) Reset query statistics (clears historical slow-query fingerprints)
SELECT pg_stat_statements_reset();

-- 2) Refresh planner stats so new indexes are used immediately
ANALYZE public.service_tracking_events;
ANALYZE public.marketplace_cache;
ANALYZE public.service_views;
ANALYZE public.vendors;
ANALYZE public.services;
ANALYZE public.co_pay_requests;
ANALYZE public.agent_performance_tracking;

-- 3) Optional: schedule a weekly stats refresh (Sunday 3:00 UTC)
-- Uncomment the block below if you'd like this automation.
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-analyze-stats') THEN
--     PERFORM cron.unschedule((SELECT jobid FROM cron.job WHERE jobname = 'weekly-analyze-stats'));
--   END IF;
--   PERFORM cron.schedule(
--     'weekly-analyze-stats',
--     '0 3 * * 0',
--     $$
--       ANALYZE public.service_tracking_events;
--       ANALYZE public.marketplace_cache;
--       ANALYZE public.service_views;
--       ANALYZE public.vendors;
--       ANALYZE public.services;
--       ANALYZE public.co_pay_requests;
--       ANALYZE public.agent_performance_tracking;
--     $$
--   );
-- END $$;
