-- Query to find any security definer objects
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as security_definer,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosecdef = true
  AND n.nspname = 'public'
ORDER BY p.proname;

-- Also check for any views that might be using security definer
SELECT 
  schemaname, 
  viewname, 
  definition 
FROM pg_views 
WHERE schemaname = 'public' 
  AND definition ILIKE '%security definer%';

-- Check for any materialized views
SELECT 
  schemaname, 
  matviewname, 
  definition 
FROM pg_matviews 
WHERE schemaname = 'public';

-- Create a function to identify security definer views properly
CREATE OR REPLACE FUNCTION public.identify_security_definer_views()
RETURNS TABLE(
  schema_name text,
  view_name text,
  view_definition text,
  has_security_definer boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.schemaname::text,
    v.viewname::text,
    v.definition::text,
    (v.definition ILIKE '%security definer%')::boolean
  FROM pg_views v
  WHERE v.schemaname = 'public';
END;
$$;