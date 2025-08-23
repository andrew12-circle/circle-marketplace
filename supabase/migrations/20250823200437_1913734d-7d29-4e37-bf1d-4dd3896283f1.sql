-- Comprehensive check for all views and their security properties
-- Check for any views in all schemas that might have security definer
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views 
WHERE definition ILIKE '%security definer%'
   OR definition ILIKE '%security_definer%'
ORDER BY schemaname, viewname;

-- Also check for any functions that might be creating views with security definer
SELECT 
    p.proname,
    p.prosecdef,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (pg_get_functiondef(p.oid) ILIKE '%create view%security definer%'
       OR pg_get_functiondef(p.oid) ILIKE '%create.*view%.*security_definer%');