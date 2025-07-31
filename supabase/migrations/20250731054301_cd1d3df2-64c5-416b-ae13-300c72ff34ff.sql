-- Check what extensions are currently installed in the public schema
SELECT n.nspname as schema_name, e.extname as extension_name, e.extversion as version 
FROM pg_extension e 
JOIN pg_namespace n ON e.extnamespace = n.oid 
WHERE n.nspname = 'public';

-- Also check if extensions schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'extensions';