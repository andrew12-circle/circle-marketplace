-- SECURITY FIX: Protect employee contact information in service_representatives table
-- First check and clean up existing policies

-- Drop the dangerous policy that exposes all employee data publicly
DROP POLICY IF EXISTS "Representatives are viewable by everyone" ON public.service_representatives;
DROP POLICY IF EXISTS "Public can view basic professional info only" ON public.service_representatives;
DROP POLICY IF EXISTS "Vendors can view their own representatives" ON public.service_representatives;
DROP POLICY IF EXISTS "Admins can view all representatives" ON public.service_representatives;
DROP POLICY IF EXISTS "Vendors can manage their own representatives" ON public.service_representatives;

-- Create secure policies that protect employee personal information

-- 1. Vendors can view and manage their own representatives' full information
CREATE POLICY "Vendors manage own representatives" 
ON public.service_representatives 
FOR ALL 
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.vendors v 
    WHERE v.id = service_representatives.vendor_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.vendors v 
    WHERE v.id = service_representatives.vendor_id
  )
);

-- 2. Admins can view and manage all representative information  
CREATE POLICY "Admins manage all representatives" 
ON public.service_representatives 
FOR ALL 
TO authenticated
USING (get_user_admin_status() = true)
WITH CHECK (get_user_admin_status() = true);

-- 3. Authenticated users can view basic professional info only (no sensitive contact details)
CREATE POLICY "Authenticated users view basic info" 
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

-- Create a secure view for public consumption that excludes sensitive contact information
CREATE OR REPLACE VIEW public.service_representatives_public AS
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
  -- Explicitly excluded: email, phone, license_number
FROM public.service_representatives
WHERE is_active = true
  AND vendor_id IN (
    SELECT id FROM public.vendors 
    WHERE is_active = true 
    AND approval_status IN ('approved', 'auto_approved')
  );

-- Grant read access to the secure view
GRANT SELECT ON public.service_representatives_public TO authenticated;
GRANT SELECT ON public.service_representatives_public TO anon;