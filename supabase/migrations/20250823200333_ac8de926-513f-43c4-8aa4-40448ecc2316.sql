-- Check if the vendor_directory view might be the issue and recreate it explicitly
-- with proper security context to avoid any potential security definer issues

-- First, let's see what views exist and their actual definitions
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;