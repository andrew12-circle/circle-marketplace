-- Drop the existing public view that may be exposing data
DROP VIEW IF EXISTS public.service_representatives_public;

-- Create a security definer function that enforces authentication
-- This ensures only authenticated users can access representative data
CREATE OR REPLACE FUNCTION public.get_public_service_representatives()
RETURNS TABLE (
  id uuid,
  vendor_id uuid,
  name text,
  title text,
  profile_picture_url text,
  bio text,
  location text,
  specialties text[],
  years_experience integer,
  website text,
  rating numeric,
  reviews_count integer,
  is_primary boolean,
  sort_order integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) 
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Only return data if user is authenticated
  SELECT 
    sr.id,
    sr.vendor_id,
    sr.name,
    sr.title,
    sr.profile_picture_url,
    sr.bio,
    sr.location,
    sr.specialties,
    sr.years_experience,
    sr.website,
    sr.rating,
    sr.reviews_count,
    sr.is_primary,
    sr.sort_order,
    sr.created_at,
    sr.updated_at
  FROM service_representatives sr
  JOIN vendors v ON sr.vendor_id = v.id
  WHERE sr.is_active = true 
    AND v.is_active = true 
    AND v.approval_status IN ('approved', 'auto_approved')
    AND auth.uid() IS NOT NULL  -- Critical: Only authenticated users
$$;

-- Grant execute permission only to authenticated users
REVOKE ALL ON FUNCTION public.get_public_service_representatives() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_service_representatives() TO authenticated;

-- Optional: Create a secure view that uses the function (for convenience)
CREATE VIEW public.service_representatives_public_secure AS 
SELECT * FROM public.get_public_service_representatives();

-- Grant SELECT permission only to authenticated users
REVOKE ALL ON public.service_representatives_public_secure FROM PUBLIC;
GRANT SELECT ON public.service_representatives_public_secure TO authenticated;