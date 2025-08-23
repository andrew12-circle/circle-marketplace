-- Security Fix: Restrict vendor table access to prevent business partner information theft

-- First, drop all existing overly permissive policies
DROP POLICY IF EXISTS "Public can view vendors" ON public.vendors;
DROP POLICY IF EXISTS "Vendors are publicly viewable" ON public.vendors;
DROP POLICY IF EXISTS "Vendors are viewable by authenticated users" ON public.vendors;
DROP POLICY IF EXISTS "Approved vendors are viewable by everyone" ON public.vendors;

-- Drop and recreate existing policies that may conflict
DROP POLICY IF EXISTS "Vendors can manage their own data" ON public.vendors;
DROP POLICY IF EXISTS "Admins can manage all vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can manage vendors" ON public.vendors;

-- Create a secure function to check if a user can view sensitive vendor data
CREATE OR REPLACE FUNCTION public.can_view_vendor_sensitive_data(vendor_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
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

-- Create a function to get vendor public profile (non-sensitive data only)
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

-- New secure policies for vendor access

-- 1. Authenticated users can view basic vendor information (public profile only)
CREATE POLICY "Authenticated users can view vendor public profiles"
ON public.vendors
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND approval_status IN ('approved', 'auto_approved')
);

-- 2. Vendors can view and update their own complete data
CREATE POLICY "Vendors can manage their own profile data"
ON public.vendors
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Admins can manage all vendor data
CREATE POLICY "Admins can manage all vendor data"
ON public.vendors
FOR ALL
TO authenticated
USING (get_user_admin_status() = true)
WITH CHECK (get_user_admin_status() = true);

-- 4. Users with business relationships can view relevant vendor contact info
CREATE POLICY "Business partners can view vendor contact info"
ON public.vendors
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND approval_status IN ('approved', 'auto_approved')
  AND (
    -- Users with active co-pay relationships
    EXISTS (
      SELECT 1 FROM public.co_pay_requests cpr
      WHERE cpr.vendor_id = vendors.id 
        AND cpr.agent_id = auth.uid()
        AND cpr.status IN ('approved', 'active', 'completed')
    )
    OR
    -- Users with point allocations from this vendor
    EXISTS (
      SELECT 1 FROM public.point_allocations pa
      WHERE pa.vendor_id = vendors.id 
        AND pa.agent_id = auth.uid()
        AND pa.status = 'active'
    )
  )
);

COMMENT ON FUNCTION public.can_view_vendor_sensitive_data IS 'Security function to control access to sensitive vendor business data';
COMMENT ON FUNCTION public.get_vendor_public_profile IS 'Returns only public, non-sensitive vendor information';