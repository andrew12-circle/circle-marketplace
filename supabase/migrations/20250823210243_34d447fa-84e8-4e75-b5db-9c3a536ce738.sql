-- Secure vendor directory views with proper RLS policies
-- These views contain sensitive business intelligence that should be protected

-- Enable RLS on vendor directory views
ALTER VIEW public.vendor_directory OWNER TO postgres;
ALTER VIEW public.vendor_directory_authenticated OWNER TO postgres;

-- Create security definer function to check if user should access vendor directory
CREATE OR REPLACE FUNCTION public.can_access_vendor_directory()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  -- Only authenticated users can access vendor directory
  SELECT auth.uid() IS NOT NULL;
$$;

-- Create RLS policies for vendor_directory (basic public directory)
CREATE POLICY "Authenticated users can view vendor directory" 
ON public.vendor_directory 
FOR SELECT 
TO authenticated 
USING (can_access_vendor_directory());

-- Block anonymous access to vendor directory
CREATE POLICY "Block anonymous access to vendor directory" 
ON public.vendor_directory 
FOR ALL 
TO anon 
USING (false);

-- Create RLS policies for vendor_directory_authenticated (detailed directory)
CREATE POLICY "Authenticated users can view detailed vendor directory" 
ON public.vendor_directory_authenticated 
FOR SELECT 
TO authenticated 
USING (can_access_vendor_directory());

-- Block anonymous access to authenticated vendor directory
CREATE POLICY "Block anonymous access to authenticated vendor directory" 
ON public.vendor_directory_authenticated 
FOR ALL 
TO anon 
USING (false);

-- Admins can manage vendor directory views
CREATE POLICY "Admins can manage vendor directory" 
ON public.vendor_directory 
FOR ALL 
TO authenticated 
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

CREATE POLICY "Admins can manage authenticated vendor directory" 
ON public.vendor_directory_authenticated 
FOR ALL 
TO authenticated 
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

-- Enable RLS on both views
ALTER VIEW public.vendor_directory ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.vendor_directory_authenticated ENABLE ROW LEVEL SECURITY;