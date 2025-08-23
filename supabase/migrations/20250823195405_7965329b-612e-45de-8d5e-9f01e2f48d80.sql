-- Drop the potentially problematic security definer functions and recreate them properly
DROP FUNCTION IF EXISTS public.get_vendor_public_profile(uuid);

-- Recreate the function without unnecessary security definer for public data
CREATE OR REPLACE FUNCTION public.get_vendor_public_profile(vendor_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  logo_url text,
  website_url text,
  rating numeric,
  review_count integer,
  is_verified boolean,
  location text,
  service_states text[],
  service_radius_miles integer,
  vendor_type text,
  is_active boolean,
  value_statement text,
  support_hours text,
  is_premium_provider boolean,
  approval_status text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    v.id,
    v.name,
    v.description,
    v.logo_url,
    v.website_url,
    v.rating,
    v.review_count,
    v.is_verified,
    v.location,
    v.service_states,
    v.service_radius_miles,
    v.vendor_type,
    v.is_active,
    v.value_statement,
    v.support_hours,
    v.is_premium_provider,
    v.approval_status
  FROM public.vendors v
  WHERE v.id = vendor_id
    AND v.is_active = true
    AND v.approval_status IN ('approved', 'auto_approved');
$$;

COMMENT ON FUNCTION public.get_vendor_public_profile IS 'Returns only public, non-sensitive vendor information (no security definer needed for public data)';