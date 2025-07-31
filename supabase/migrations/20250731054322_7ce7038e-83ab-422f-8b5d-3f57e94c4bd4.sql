-- Get all extensions and their schemas
SELECT 
    e.extname as extension_name,
    n.nspname as schema_name,
    e.extversion as version
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
ORDER BY n.nspname, e.extname;

-- Check for any objects in public schema that might be extension-related
SELECT schemaname, tablename, tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%extension%'
LIMIT 10;