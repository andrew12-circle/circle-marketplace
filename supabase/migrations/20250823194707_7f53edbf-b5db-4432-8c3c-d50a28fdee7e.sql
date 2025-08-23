-- Fix security linter warnings for function search path

-- Update the vendor data access function with secure search path
CREATE OR REPLACE FUNCTION public.can_view_vendor_sensitive_data(vendor_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    -- Admins can see everything
    get_user_admin_status() = true
    OR
    -- Vendors can see their own data
    auth.uid() = vendor_id
    OR
    -- Users with active co-pay relationships can see basic business info
    EXISTS (
      SELECT 1 FROM public.co_pay_requests cpr
      WHERE cpr.vendor_id = vendor_id 
        AND cpr.agent_id = auth.uid()
        AND cpr.status IN ('approved', 'active', 'completed')
    );
$$;

-- Update the vendor public profile function with secure search path
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
SECURITY DEFINER
STABLE
SET search_path = public
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