-- SECURITY FIX: Remove dangerous public access policy and implement secure RLS
-- Remove the overly permissive policy that allows public access
DROP POLICY IF EXISTS "System can manage AI preferences" ON public.user_ai_preferences;

-- Drop existing user policy to recreate with better security
DROP POLICY IF EXISTS "Users can manage their own AI preferences" ON public.user_ai_preferences;

-- Create secure policies that protect user AI preference data
CREATE POLICY "Users can view their own AI preferences" 
ON public.user_ai_preferences 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI preferences" 
ON public.user_ai_preferences 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI preferences" 
ON public.user_ai_preferences 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role can manage AI preferences for system operations (logging, analytics)
CREATE POLICY "Service role can manage AI preferences" 
ON public.user_ai_preferences 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can view all AI preferences for analytics and support
CREATE POLICY "Admins can view all AI preferences" 
ON public.user_ai_preferences 
FOR SELECT 
TO authenticated
USING (get_user_admin_status() = true);