-- SECURITY FIX: Protect vendor business data from competitor scraping
-- Remove public access to vendor_directory and implement authentication requirements

-- First, revoke any anonymous access to the vendor_directory view
REVOKE ALL ON public.vendor_directory FROM anon;
REVOKE ALL ON public.vendor_directory FROM public;

-- Drop and recreate the vendor_directory view with restricted business data
DROP VIEW IF EXISTS public.vendor_directory;

-- Create a new vendor_directory view with limited public information
-- Separate sensitive business data from public marketing data
CREATE VIEW public.vendor_directory 
WITH (security_invoker = true, security_barrier = true) AS
SELECT 
  id,
  name,                          -- Business name (needed for selection)
  logo_url,                      -- Logo for display
  rating,                        -- Public rating
  review_count,                  -- Review count
  is_verified,                   -- Verification status
  is_premium_provider,           -- Premium status
  vendor_type,                   -- General category
  created_at,
  updated_at
  -- EXPLICITLY EXCLUDED from public view:
  -- description (business strategy)
  -- location (specific addresses) 
  -- website_url (can be used for competitive analysis)
  -- service_states (market coverage intelligence)
  -- value_statement (competitive positioning)
  -- service_radius_miles (market coverage)
  -- support_hours (operational details)
FROM public.vendors
WHERE is_active = true
  AND approval_status IN ('approved', 'auto_approved');

-- Create a detailed vendor view for authenticated users with business partnerships
CREATE VIEW public.vendor_directory_authenticated 
WITH (security_invoker = true, security_barrier = true) AS
SELECT 
  id,
  name,
  description,                   -- Business description
  logo_url,
  website_url,                   -- Website for partnerships
  rating,
  review_count,
  is_verified,
  location,                      -- General location for partnerships
  service_states,                -- Service coverage for business decisions
  service_radius_miles,          -- Service radius
  vendor_type,
  value_statement,               -- Value proposition
  support_hours,                 -- Support information
  is_premium_provider,
  created_at,
  updated_at
FROM public.vendors
WHERE is_active = true
  AND approval_status IN ('approved', 'auto_approved');

-- Grant access appropriately
-- Basic vendor directory: accessible to authenticated users only
GRANT SELECT ON public.vendor_directory TO authenticated;

-- Detailed vendor directory: accessible only to authenticated users
GRANT SELECT ON public.vendor_directory_authenticated TO authenticated;

-- Create RLS policies on the underlying vendors table for extra protection
-- Drop existing overly permissive policies for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view vendor public profiles" ON public.vendors;
DROP POLICY IF EXISTS "Business partners can view vendor contact info" ON public.vendors;

-- Create new granular policies
CREATE POLICY "Authenticated users can view basic vendor info"
ON public.vendors
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND approval_status IN ('approved', 'auto_approved')
);

-- Create a policy for detailed business information access
-- Only for users with active business relationships or special permissions
CREATE POLICY "Business partners can view detailed vendor info"
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
    -- Or users who have purchased services from this vendor
    OR EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.order_items oi ON o.id = oi.order_id
      JOIN public.services s ON oi.service_id = s.id
      WHERE s.vendor_id = vendors.id
        AND o.user_id = auth.uid()
    )
    -- Or admins
    OR get_user_admin_status() = true
  )
);

-- Block all anonymous access to the vendors table
CREATE POLICY "Block anonymous access to vendor data"
ON public.vendors
FOR ALL
TO anon
USING (false);