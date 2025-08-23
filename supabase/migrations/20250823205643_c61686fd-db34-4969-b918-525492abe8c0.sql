-- Force drop all existing policies and recreate securely
DROP POLICY IF EXISTS "Admins can view all vendor analytics cache" ON public.vendor_analytics_cache;
DROP POLICY IF EXISTS "Analytics cache viewable by admins" ON public.vendor_analytics_cache;
DROP POLICY IF EXISTS "System can update analytics cache" ON public.vendor_analytics_cache;
DROP POLICY IF EXISTS "Vendors can view their own analytics cache" ON public.vendor_analytics_cache;
DROP POLICY IF EXISTS "Service role can manage analytics cache" ON public.vendor_analytics_cache;
DROP POLICY IF EXISTS "Authenticated users can insert analytics cache" ON public.vendor_analytics_cache;
DROP POLICY IF EXISTS "Authenticated users can update analytics cache" ON public.vendor_analytics_cache;

-- Create comprehensive secure RLS policies for vendor analytics cache
CREATE POLICY "admins_view_all_vendor_analytics" 
ON public.vendor_analytics_cache 
FOR SELECT 
TO authenticated 
USING (get_user_admin_status());

CREATE POLICY "vendors_view_own_analytics" 
ON public.vendor_analytics_cache 
FOR SELECT 
TO authenticated 
USING (auth.uid() = vendor_id);

CREATE POLICY "service_role_full_access" 
ON public.vendor_analytics_cache 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.vendor_analytics_cache ENABLE ROW LEVEL SECURITY;