-- Create a secure vendor directory view for public consumption
CREATE OR REPLACE VIEW public.vendor_directory AS
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
  v.value_statement,
  v.support_hours,
  v.is_premium_provider,
  v.created_at,
  v.updated_at
FROM public.vendors v
WHERE v.is_active = true 
  AND v.approval_status IN ('approved', 'auto_approved');

-- Grant appropriate access to the directory view
GRANT SELECT ON public.vendor_directory TO authenticated;
GRANT SELECT ON public.vendor_directory TO anon;

-- Create RLS policy for the directory view
ALTER VIEW public.vendor_directory SET (security_barrier = true);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_vendors_active_approved 
ON public.vendors (is_active, approval_status) 
WHERE is_active = true AND approval_status IN ('approved', 'auto_approved');

CREATE INDEX IF NOT EXISTS idx_vendors_location 
ON public.vendors (location) 
WHERE is_active = true;

COMMENT ON VIEW public.vendor_directory IS 'Public directory of approved vendors with non-sensitive information only - safe for public consumption';