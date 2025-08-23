-- Check the exact query the linter is flagging by examining the database state
-- Look for any views that might be detected as having security definer properties

-- Check all views and their access methods
SELECT 
    schemaname,
    viewname,
    viewowner,
    substring(definition from 1 for 200) as definition_start
FROM pg_views 
WHERE schemaname IN ('public', 'auth', 'storage')
ORDER BY schemaname, viewname;

-- Check if there are any view-related security issues by examining view properties
SELECT 
    v.viewname,
    v.viewowner,
    CASE 
        WHEN v.definition LIKE '%auth.%' THEN 'Uses auth functions'
        WHEN v.definition LIKE '%security%' THEN 'Contains security keywords'
        ELSE 'Standard view'
    END as security_analysis
FROM pg_views v
WHERE v.schemaname = 'public';