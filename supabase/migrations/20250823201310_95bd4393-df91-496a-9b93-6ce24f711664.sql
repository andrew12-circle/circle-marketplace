-- SECURITY FIX: Address Security Definer View issues
-- The problem is views bypass RLS unless properly configured

-- Fix the service_representatives_public view to be security invoker
DROP VIEW IF EXISTS public.service_representatives_public;

CREATE VIEW public.service_representatives_public 
WITH (security_invoker = true) AS
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
FROM public.service_representatives
WHERE is_active = true
  AND vendor_id IN (
    SELECT id FROM public.vendors 
    WHERE is_active = true 
    AND approval_status IN ('approved', 'auto_approved')
  );

-- Fix the vendor_directory view to be security invoker
DROP VIEW IF EXISTS public.vendor_directory;

CREATE VIEW public.vendor_directory 
WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  description,
  logo_url,
  website_url,
  rating,
  review_count,
  is_verified,
  location,
  service_states,
  service_radius_miles,
  vendor_type,
  value_statement,
  support_hours,
  is_premium_provider,
  created_at,
  updated_at
FROM public.vendors
WHERE is_active = true
  AND approval_status IN ('approved', 'auto_approved');

-- Ensure RLS is enabled on the underlying tables
ALTER TABLE public.service_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Grant appropriate permissions on the views
GRANT SELECT ON public.service_representatives_public TO authenticated;
GRANT SELECT ON public.service_representatives_public TO anon;
GRANT SELECT ON public.vendor_directory TO authenticated;
GRANT SELECT ON public.vendor_directory TO anon;