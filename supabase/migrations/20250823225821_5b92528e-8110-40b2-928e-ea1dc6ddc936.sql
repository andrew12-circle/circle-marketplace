-- Enable Row Level Security on service_representatives_public table
ALTER TABLE public.service_representatives_public ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can view basic representative profiles
-- This allows legitimate users to see representatives while blocking anonymous access
CREATE POLICY "Authenticated users can view representative profiles" 
ON public.service_representatives_public 
FOR SELECT 
TO authenticated
USING (true);

-- Policy 2: Vendors can manage their own representative profiles
CREATE POLICY "Vendors can manage their own representatives" 
ON public.service_representatives_public 
FOR ALL 
TO authenticated
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- Policy 3: Admins can manage all representative profiles
CREATE POLICY "Admins can manage all representatives" 
ON public.service_representatives_public 
FOR ALL 
TO authenticated
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

-- Policy 4: Service role can manage data for system operations
CREATE POLICY "Service role can manage representative data" 
ON public.service_representatives_public 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);