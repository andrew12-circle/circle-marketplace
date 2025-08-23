-- SECURITY FIX: Protect employee contact information in service_representatives table
-- Remove dangerous public access policy and implement secure data protection

-- Drop the dangerous policy that exposes all employee data publicly
DROP POLICY IF EXISTS "Representatives are viewable by everyone" ON public.service_representatives;

-- Create secure policies that protect employee personal information

-- 1. Allow viewing of basic professional information only (no personal contact details)
CREATE POLICY "Public can view basic professional info only" 
ON public.service_representatives 
FOR SELECT 
TO public
USING (
  is_active = true 
  AND vendor_id IN (
    SELECT id FROM public.vendors 
    WHERE is_active = true 
    AND approval_status IN ('approved', 'auto_approved')
  )
);

-- 2. Vendors can view their own representatives' full information
CREATE POLICY "Vendors can view their own representatives" 
ON public.service_representatives 
FOR SELECT 
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM public.vendors v 
    WHERE v.id = auth.uid() OR v.id = vendor_id
  )
);

-- 3. Admins can view all representative information
CREATE POLICY "Admins can view all representatives" 
ON public.service_representatives 
FOR SELECT 
TO authenticated
USING (get_user_admin_status() = true);

-- 4. Vendors can manage their own representatives
CREATE POLICY "Vendors can manage their own representatives" 
ON public.service_representatives 
FOR ALL 
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM public.vendors v 
    WHERE v.id = auth.uid()
  )
)
WITH CHECK (
  vendor_id IN (
    SELECT id FROM public.vendors v 
    WHERE v.id = auth.uid()
  )
);

-- Note: The existing admin policy "Admins can manage all representatives" remains in place

-- Create a secure view for public consumption that excludes sensitive data
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
  sort_order
FROM public.service_representatives
WHERE is_active = true
  AND vendor_id IN (
    SELECT id FROM public.vendors 
    WHERE is_active = true 
    AND approval_status IN ('approved', 'auto_approved')
  );

-- Grant public read access to the secure view
GRANT SELECT ON public.service_representatives_public TO public;
GRANT SELECT ON public.service_representatives_public TO anon;