-- Fix the audit function by dropping triggers first

-- Drop existing triggers
DROP TRIGGER IF EXISTS vendors_audit_trigger ON vendors;
DROP TRIGGER IF EXISTS services_audit_trigger ON services;
DROP TRIGGER IF EXISTS profiles_audit_trigger ON profiles;

-- Drop and recreate the audit function with proper search path
DROP FUNCTION IF EXISTS audit_changes();

CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER 
SET search_path = ''
AS $$
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
$$ LANGUAGE plpgsql;

-- Recreate triggers with the fixed function
CREATE TRIGGER vendors_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON vendors
  FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER services_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER profiles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_changes();

-- Fix the get_public_profile function to remove SECURITY DEFINER
DROP FUNCTION IF EXISTS get_public_profile(uuid);

CREATE OR REPLACE FUNCTION get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  business_name text,
  location text,
  specialties text[],
  years_experience integer,
  website_url text,
  avatar_url text
) 
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.business_name,
    p.location,
    p.specialties,
    p.years_experience,
    p.website_url,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = profile_id;
END;
$$ LANGUAGE plpgsql;