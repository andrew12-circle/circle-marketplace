-- Fix security issues from the linter

-- 1. Fix the function search path mutable issue
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DECIMAL(10, 8),
  lon1 DECIMAL(11, 8),
  lat2 DECIMAL(10, 8),
  lon2 DECIMAL(11, 8)
) RETURNS DECIMAL AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. Drop the security definer view and create it as a regular view
DROP VIEW IF EXISTS public.vendors_with_local_reps;

-- Create a safe view without security definer
CREATE OR REPLACE VIEW public.vendors_with_local_reps AS
SELECT 
  v.*,
  (
    SELECT json_agg(
      json_build_object(
        'id', rep.id,
        'name', rep.individual_name,
        'title', rep.individual_title,
        'phone', rep.individual_phone,
        'email', rep.individual_email,
        'license_number', rep.individual_license_number,
        'nmls_id', rep.nmls_id,
        'location', rep.location,
        'latitude', rep.latitude,
        'longitude', rep.longitude
      )
    )
    FROM public.vendors rep 
    WHERE rep.parent_vendor_id = v.id 
    AND rep.vendor_type IN ('individual', 'branch')
    AND rep.is_active = true
  ) as local_representatives
FROM public.vendors v
WHERE v.vendor_type = 'company' AND v.is_active = true;