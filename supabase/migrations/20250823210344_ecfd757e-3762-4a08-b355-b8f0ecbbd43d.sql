-- Secure vendor directory by protecting the underlying vendors table
-- The vendor_directory and vendor_directory_authenticated views will inherit this security

-- First check if vendors table has RLS enabled
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive existing policies
DROP POLICY IF EXISTS "Vendors are publicly viewable" ON public.vendors;
DROP POLICY IF EXISTS "Public vendor access" ON public.vendors;

-- Create secure access policies for vendors table
CREATE POLICY "Authenticated users can view approved vendors" 
ON public.vendors 
FOR SELECT 
TO authenticated 
USING (
  is_active = true 
  AND approval_status IN ('approved', 'auto_approved')
);

-- Block anonymous access to vendors table (secures both directory views)
CREATE POLICY "Block anonymous vendor access" 
ON public.vendors 
FOR ALL 
TO anon 
USING (false);

-- Vendors can manage their own records
CREATE POLICY "Vendors can update their own profiles" 
ON public.vendors 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Vendors can view their own complete profiles" 
ON public.vendors 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Admins can manage all vendor records
CREATE POLICY "Admins can manage all vendors" 
ON public.vendors 
FOR ALL 
TO authenticated 
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

-- Service role can manage vendors for system operations
CREATE POLICY "Service role can manage vendors" 
ON public.vendors 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);