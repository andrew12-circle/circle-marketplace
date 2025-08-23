-- Completely secure vendor analytics cache table
-- First, get a clean slate by dropping ALL policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies on vendor_analytics_cache
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'vendor_analytics_cache' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.vendor_analytics_cache', policy_record.policyname);
    END LOOP;
END $$;

-- Create secure RLS policies for sensitive vendor analytics data
CREATE POLICY "Admins can view all vendor analytics" 
ON public.vendor_analytics_cache 
FOR SELECT 
TO authenticated 
USING (get_user_admin_status());

CREATE POLICY "Vendors can view only their own analytics" 
ON public.vendor_analytics_cache 
FOR SELECT 
TO authenticated 
USING (auth.uid() = vendor_id);

CREATE POLICY "Service role manages analytics cache" 
ON public.vendor_analytics_cache 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Block direct INSERT/UPDATE from regular users to prevent data manipulation
CREATE POLICY "Block unauthorized analytics modifications" 
ON public.vendor_analytics_cache 
FOR INSERT 
TO authenticated 
WITH CHECK (false);

CREATE POLICY "Block unauthorized analytics updates" 
ON public.vendor_analytics_cache 
FOR UPDATE 
TO authenticated 
USING (false);

CREATE POLICY "Block analytics deletion" 
ON public.vendor_analytics_cache 
FOR DELETE 
TO authenticated 
USING (false);

-- Ensure RLS is enabled to enforce all policies
ALTER TABLE public.vendor_analytics_cache ENABLE ROW LEVEL SECURITY;