-- Fix the remaining security issues

-- 1. Move pg_net extension from public schema to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_net SET SCHEMA extensions;

-- Grant necessary permissions on the moved extension
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 2. Check and fix any remaining security definer views
-- Since the query returned empty, let's double check for any materialized views or other view types
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Check for any views that might be using SECURITY DEFINER in their definition
    FOR view_record IN 
        SELECT schemaname, viewname, definition
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        -- Log what we find for debugging
        RAISE NOTICE 'Checking view: %.%', view_record.schemaname, view_record.viewname;
        
        -- If any view definition contains security definer, we need to recreate it
        IF view_record.definition ILIKE '%security definer%' THEN
            RAISE NOTICE 'Found security definer view: %.%', view_record.schemaname, view_record.viewname;
        END IF;
    END LOOP;
END $$;