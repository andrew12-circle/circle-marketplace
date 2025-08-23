-- Clean up and create secure vendor analytics cache policies
-- Drop all existing policies first
DROP POLICY IF EXISTS "Admins can view all vendor analytics cache" ON public.vendor_analytics_cache;
DROP POLICY IF EXISTS "Analytics cache viewable by admins" ON public.vendor_analytics_cache;
DROP POLICY IF EXISTS "System can update analytics cache" ON public.vendor_analytics_cache;

-- Create comprehensive secure RLS policies
CREATE POLICY "Admins can view all vendor analytics cache" 
ON public.vendor_analytics_cache 
FOR SELECT 
TO authenticated 
USING (get_user_admin_status());

CREATE POLICY "Vendors can view their own analytics cache" 
ON public.vendor_analytics_cache 
FOR SELECT 
TO authenticated 
USING (auth.uid() = vendor_id);

CREATE POLICY "Service role can manage analytics cache" 
ON public.vendor_analytics_cache 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can insert analytics cache" 
ON public.vendor_analytics_cache 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update analytics cache" 
ON public.vendor_analytics_cache 
FOR UPDATE 
TO authenticated 
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.vendor_analytics_cache ENABLE ROW LEVEL SECURITY;