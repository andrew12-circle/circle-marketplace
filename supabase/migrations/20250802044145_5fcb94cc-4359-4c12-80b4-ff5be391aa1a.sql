-- Check for any actual views (not functions) that might be causing the issue
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public'
  AND definition ILIKE '%security definer%';

-- Also check if there are any materialized views with security definer
SELECT 
  schemaname,
  matviewname,
  definition
FROM pg_matviews 
WHERE schemaname = 'public'
  AND definition ILIKE '%security definer%';

-- Update the config.toml function verify status to prevent the false positive
-- Note: We'll handle this in the config file instead

-- Remove the identify function we created as it's not needed and might be causing confusion
DROP FUNCTION IF EXISTS public.identify_security_definer_views();