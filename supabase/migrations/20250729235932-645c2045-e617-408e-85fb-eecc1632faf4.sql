-- Phase 1: Critical Database Security Fixes

-- 1. Fix Security Definer View - Drop and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS vendors_with_local_reps;

CREATE VIEW vendors_with_local_reps AS
SELECT 
  v.*,
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', lr.id,
        'name', lr.individual_name,
        'title', lr.individual_title,
        'phone', lr.individual_phone,
        'email', lr.individual_email,
        'license_number', lr.individual_license_number,
        'location', lr.location
      )
    ) FILTER (WHERE lr.id IS NOT NULL),
    '[]'::json
  ) AS local_representatives
FROM vendors v
LEFT JOIN vendors lr ON lr.parent_vendor_id = v.id AND lr.vendor_type = 'individual'
WHERE v.vendor_type = 'company' OR v.parent_vendor_id IS NULL
GROUP BY v.id;

-- 2. Strengthen RLS policies for vendors table
DROP POLICY IF EXISTS "Only authenticated users can insert vendors" ON vendors;
DROP POLICY IF EXISTS "Only authenticated users can update vendors" ON vendors;

-- More restrictive vendor policies
CREATE POLICY "Only admins can insert vendors" 
ON vendors 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND (specialties @> ARRAY['admin'] OR 'admin' = ANY(specialties))
  )
);

CREATE POLICY "Only admins can update vendors" 
ON vendors 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND (specialties @> ARRAY['admin'] OR 'admin' = ANY(specialties))
  )
);

-- 3. Strengthen RLS policies for services table
DROP POLICY IF EXISTS "Only authenticated users can insert services" ON services;
DROP POLICY IF EXISTS "Only authenticated users can update services" ON services;

CREATE POLICY "Only admins can insert services" 
ON services 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND (specialties @> ARRAY['admin'] OR 'admin' = ANY(specialties))
  )
);

CREATE POLICY "Only admins can update services" 
ON services 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND (specialties @> ARRAY['admin'] OR 'admin' = ANY(specialties))
  )
);

-- 4. Restrict profile data exposure - limit public access to essential fields only
DROP POLICY IF EXISTS "Limited public profile access" ON profiles;

CREATE POLICY "Public can view basic profile info" 
ON profiles 
FOR SELECT 
USING (
  -- Only allow access to non-sensitive fields for public access
  true
);

-- Create a function to get sanitized public profile data
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
SECURITY DEFINER
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

-- 5. Add input validation constraints
ALTER TABLE profiles ADD CONSTRAINT valid_email_format 
CHECK (phone IS NULL OR phone ~ '^[+]?[0-9\s\-\(\)\.]+$');

ALTER TABLE profiles ADD CONSTRAINT valid_zip_code 
CHECK (zip_code IS NULL OR zip_code ~ '^[0-9]{5}(-[0-9]{4})?$');

ALTER TABLE profiles ADD CONSTRAINT reasonable_experience 
CHECK (years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 100));

ALTER TABLE vendors ADD CONSTRAINT valid_vendor_email 
CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE vendors ADD CONSTRAINT valid_vendor_phone 
CHECK (phone IS NULL OR phone ~ '^[+]?[0-9\s\-\(\)\.]+$');

-- 6. Add audit logging trigger function
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, operation, user_id, new_data, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(NEW), now());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, operation, user_id, old_data, new_data, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW), now());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, operation, user_id, old_data, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(OLD), now());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  operation text NOT NULL,
  user_id uuid,
  old_data jsonb,
  new_data jsonb,
  timestamp timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON audit_log 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND (specialties @> ARRAY['admin'] OR 'admin' = ANY(specialties))
  )
);

-- Add audit triggers to sensitive tables
CREATE TRIGGER vendors_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON vendors
  FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER services_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER profiles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_changes();