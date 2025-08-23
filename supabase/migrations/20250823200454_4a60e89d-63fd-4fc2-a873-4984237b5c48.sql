-- Check for views with security definer in their definition
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE definition ILIKE '%security definer%'
   OR definition ILIKE '%security_definer%'
ORDER BY schemaname, viewname;