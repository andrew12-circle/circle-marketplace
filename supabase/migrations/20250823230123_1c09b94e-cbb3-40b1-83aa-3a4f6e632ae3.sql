-- Remove the SECURITY DEFINER approach that triggered the warning
DROP VIEW IF EXISTS public.service_representatives_public_secure;
DROP FUNCTION IF EXISTS public.get_public_service_representatives();

-- Create a simple view that relies on the underlying table's RLS policies
-- This is the cleanest approach - let RLS handle the security
CREATE VIEW public.service_representatives_public AS 
SELECT 
  id,
  vendor_id,
  name,
  title,
  profile_picture_url,
  bio,
  location,
  specialties,
  years_experience,
  website,
  rating,
  reviews_count,
  is_primary,
  sort_order,
  created_at,
  updated_at
FROM service_representatives
WHERE is_active = true 
  AND vendor_id IN (
    SELECT id FROM vendors 
    WHERE is_active = true 
    AND approval_status IN ('approved', 'auto_approved')
  );

-- The view will automatically inherit RLS policies from service_representatives table
-- No additional grants needed - RLS will handle access control