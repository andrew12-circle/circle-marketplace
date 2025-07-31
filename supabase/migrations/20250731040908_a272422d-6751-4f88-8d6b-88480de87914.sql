-- Fix remaining critical security issues

-- 1. First, check if there are any SECURITY DEFINER views and update them
-- Let's identify and fix any problematic views

-- Check for security definer views and update if needed
-- Note: We need to be careful about which views actually need SECURITY DEFINER

-- 2. Move extensions from public schema to appropriate schema
-- First check what extensions are in public schema
DO $$
DECLARE
    ext_record RECORD;
BEGIN
    -- List extensions in public schema
    FOR ext_record IN 
        SELECT extname 
        FROM pg_extension 
        WHERE extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        -- Move common extensions to extensions schema if they exist
        IF ext_record.extname IN ('uuid-ossp', 'pgcrypto', 'unaccent') THEN
            EXECUTE format('CREATE SCHEMA IF NOT EXISTS extensions');
            EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_record.extname);
        END IF;
    END LOOP;
END $$;

-- 3. Grant necessary permissions on extensions schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions') THEN
        GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
    END IF;
END $$;

-- 4. Fix any remaining search path issues
-- Update any remaining functions that might need search path fixes
CREATE OR REPLACE FUNCTION public.audit_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, new_data, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(NEW), now());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, old_data, new_data, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW), now());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, old_data, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(OLD), now());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- 5. Clean up any views that might be using SECURITY DEFINER incorrectly
-- Note: This is a precautionary measure to ensure we don't have problematic views
-- We'll recreate the vendors_with_local_reps view if it exists as a regular view

DROP VIEW IF EXISTS public.vendors_with_local_reps CASCADE;

-- Recreate as a regular view (not SECURITY DEFINER) if needed
CREATE OR REPLACE VIEW public.vendors_with_local_reps AS
SELECT 
    v.*,
    CASE 
        WHEN v.vendor_type = 'individual' THEN 
            jsonb_build_array(
                jsonb_build_object(
                    'name', v.individual_name,
                    'title', v.individual_title,
                    'phone', v.individual_phone,
                    'email', v.individual_email,
                    'license_number', v.individual_license_number
                )
            )
        ELSE '[]'::jsonb
    END as local_representatives
FROM public.vendors v
WHERE v.is_active = true;