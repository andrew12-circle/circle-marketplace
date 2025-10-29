-- Fix services table RLS policies - remove redundant policies causing timeouts

-- Drop all existing SELECT policies on services
DROP POLICY IF EXISTS "Active services are viewable by everyone" ON public.services;
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
DROP POLICY IF EXISTS "Users can view active services" ON public.services;
DROP POLICY IF EXISTS "Public can view services" ON public.services;
DROP POLICY IF EXISTS "Admins can view all services" ON public.services;

-- Create optimized policies
-- 1. Everyone (including anonymous) can view active services
CREATE POLICY "view_active_services"
ON public.services
FOR SELECT
TO public
USING (is_active = true);

-- 2. Admins can view all services (active and inactive)
CREATE POLICY "admin_view_all_services"
ON public.services
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Ensure update/delete policies remain for admins
-- Keep the existing "Admins can manage all services" policy for INSERT/UPDATE
-- Keep the existing "Admins can delete services" policy for DELETE