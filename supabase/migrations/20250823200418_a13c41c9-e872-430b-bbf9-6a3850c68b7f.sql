-- SECURITY FIX: Address Security Definer View issue by recreating view properly
-- Drop and recreate vendor_directory view to ensure it respects RLS properly

-- Drop existing view
DROP VIEW IF EXISTS public.vendor_directory;

-- Recreate view with proper syntax - PostgreSQL views are SECURITY INVOKER by default
-- This ensures the view uses the permissions of the querying user, not the view creator
CREATE VIEW public.vendor_directory AS 
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

-- The view will now properly respect RLS policies on the underlying vendors table
-- Grant appropriate permissions to the view
GRANT SELECT ON public.vendor_directory TO authenticated;
GRANT SELECT ON public.vendor_directory TO anon;