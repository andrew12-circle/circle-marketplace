-- Check what extensions are currently installed in the public schema
SELECT schemaname, extname, extversion 
FROM pg_extension 
JOIN pg_namespace ON pg_extension.extnamespace = pg_namespace.oid 
WHERE schemaname = 'public';

-- List all extensions to see what we're working with
SELECT schemaname, extname, extversion 
FROM pg_extension 
JOIN pg_namespace ON pg_extension.extnamespace = pg_namespace.oid;