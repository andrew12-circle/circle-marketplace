-- Secure vendor directory views by recreating them with proper access controls
-- Drop and recreate the views to ensure they inherit security from the vendors table

-- Drop existing views
DROP VIEW IF EXISTS public.vendor_directory CASCADE;
DROP VIEW IF EXISTS public.vendor_directory_authenticated CASCADE;

-- Recreate vendor_directory with security context
CREATE VIEW public.vendor_directory
WITH (security_barrier = true, security_invoker = true) AS
SELECT 
    id,
    name,
    logo_url,
    rating,
    review_count,
    is_verified,
    is_premium_provider,
    vendor_type,
    created_at,
    updated_at
FROM public.vendors
WHERE 
    is_active = true 
    AND approval_status IN ('approved', 'auto_approved')
    AND auth.uid() IS NOT NULL; -- Require authentication

-- Recreate vendor_directory_authenticated with enhanced security
CREATE VIEW public.vendor_directory_authenticated
WITH (security_barrier = true, security_invoker = true) AS
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
WHERE 
    is_active = true 
    AND approval_status IN ('approved', 'auto_approved')
    AND auth.uid() IS NOT NULL; -- Require authentication

-- Grant appropriate permissions
GRANT SELECT ON public.vendor_directory TO authenticated;
GRANT SELECT ON public.vendor_directory_authenticated TO authenticated;

-- Revoke public access
REVOKE ALL ON public.vendor_directory FROM anon;
REVOKE ALL ON public.vendor_directory FROM public;
REVOKE ALL ON public.vendor_directory_authenticated FROM anon;
REVOKE ALL ON public.vendor_directory_authenticated FROM public;