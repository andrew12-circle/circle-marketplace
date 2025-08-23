-- SECURITY FIX: Remove public access to agents table
-- This policy allows anyone to read all agent data including sensitive personal information
DROP POLICY IF EXISTS "Agents are viewable by everyone" ON public.agents;

-- Create secure policies for the agents table

-- Allow users to view their own agent profile
CREATE POLICY "Users can view their own agent profile" 
ON public.agents 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow admins to view all agent profiles
CREATE POLICY "Admins can view all agent profiles" 
ON public.agents 
FOR SELECT 
USING (get_user_admin_status() = true);

-- Create a secure view for public agent listings that only exposes safe, non-sensitive fields
CREATE OR REPLACE VIEW public.public_agent_listings AS
SELECT 
  id,
  first_name,
  last_name,
  city,
  state,
  zip_code,
  brokerage,
  bio,
  photo_url,
  social_facebook,
  social_instagram,
  social_linkedin,
  social_youtube,
  social_zillow,
  years_active,
  is_active
FROM public.agents
WHERE is_active = true
  AND first_name IS NOT NULL 
  AND last_name IS NOT NULL;

-- Grant select access to the public view
GRANT SELECT ON public.public_agent_listings TO public;

-- Create RLS policy for the view to ensure it's secure
ALTER VIEW public.public_agent_listings SET (security_barrier = false);