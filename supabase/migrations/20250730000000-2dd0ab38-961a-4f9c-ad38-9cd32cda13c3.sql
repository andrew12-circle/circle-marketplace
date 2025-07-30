-- Fix remaining security issues

-- 1. Fix the get_public_profile function to remove SECURITY DEFINER
DROP FUNCTION IF EXISTS get_public_profile(uuid);

-- Create a safer version without SECURITY DEFINER
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
  FROM profiles p
  WHERE p.id = profile_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix the audit_changes function search path
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

-- 3. Fix existing functions that might have search path issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, circle_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    100  -- Welcome bonus points
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_saved_services_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  radius DECIMAL := 3959; -- Earth radius in miles
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN radius * c;
END;
$$;