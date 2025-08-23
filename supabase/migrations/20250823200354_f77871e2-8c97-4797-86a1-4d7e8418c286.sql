-- SECURITY FIX: Address Security Definer View issue
-- Drop and recreate vendor_directory view with explicit security invoker settings

-- Drop existing view
DROP VIEW IF EXISTS public.vendor_directory;

-- Recreate view explicitly as SECURITY INVOKER to ensure it respects RLS of querying user
CREATE VIEW public.vendor_directory 
SECURITY INVOKER
AS 
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
FROM public.vendors v
WHERE is_active = true 
  AND approval_status IN ('approved', 'auto_approved');

-- Ensure the view respects RLS by explicitly setting security invoker
-- This ensures the view uses the permissions of the querying user, not the view creator

-- Grant appropriate permissions to the view
GRANT SELECT ON public.vendor_directory TO authenticated;
GRANT SELECT ON public.vendor_directory TO anon;