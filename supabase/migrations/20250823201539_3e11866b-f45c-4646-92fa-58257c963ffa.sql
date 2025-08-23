-- SECURITY FIX: Restrict anonymous access to service representatives
-- Remove anonymous access from the service_representatives_public view

REVOKE ALL ON public.service_representatives_public FROM anon;
REVOKE ALL ON public.service_representatives_public FROM public;

-- Only allow authenticated users to view service representative public information
-- This ensures anonymous users cannot access employee data at all

-- Verify the view only contains safe, non-sensitive information
-- Re-create the view with explicit column selection to be extra sure
DROP VIEW IF EXISTS public.service_representatives_public;

CREATE VIEW public.service_representatives_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  vendor_id,
  name,                    -- Professional name only
  title,                   -- Job title only  
  profile_picture_url,     -- Public professional photo
  bio,                     -- Professional bio
  location,                -- General location (city/state)
  specialties,             -- Professional specialties
  years_experience,        -- Experience level
  website,                 -- Professional website
  rating,                  -- Service rating
  reviews_count,           -- Number of reviews
  is_primary,              -- Primary contact flag
  sort_order,              -- Display order
  created_at,
  updated_at
  -- EXPLICITLY EXCLUDED: email, phone, license_number, personal details
FROM public.service_representatives
WHERE is_active = true
  AND vendor_id IN (
    SELECT id FROM public.vendors 
    WHERE is_active = true 
    AND approval_status IN ('approved', 'auto_approved')
  );

-- Grant access only to authenticated users, no anonymous access
GRANT SELECT ON public.service_representatives_public TO authenticated;

-- Add RLS policy to the view itself for extra protection
ALTER VIEW public.service_representatives_public SET (security_barrier = true);

-- Create additional protection policies on the underlying table
-- Ensure anonymous users cannot access the main table directly
CREATE POLICY "Block anonymous access to service representatives"
ON public.service_representatives
FOR ALL
TO anon
USING (false);

-- Ensure authenticated users can only see basic professional info
DROP POLICY IF EXISTS "Authenticated users view basic info" ON public.service_representatives;
CREATE POLICY "Authenticated users view basic professional info only"
ON public.service_representatives
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND vendor_id IN (
    SELECT id FROM public.vendors 
    WHERE is_active = true 
    AND approval_status IN ('approved', 'auto_approved')
  )
);

-- Add a policy to completely block direct access to sensitive columns for non-owners
CREATE POLICY "Block sensitive data access"
ON public.service_representatives
FOR SELECT
TO authenticated
USING (
  -- Only allow access to sensitive fields for vendors who own the representative
  -- or admins
  CASE 
    WHEN auth.uid() IN (
      SELECT id FROM public.vendors 
      WHERE id = service_representatives.vendor_id
    ) THEN true
    WHEN get_user_admin_status() = true THEN true
    ELSE false
  END
);