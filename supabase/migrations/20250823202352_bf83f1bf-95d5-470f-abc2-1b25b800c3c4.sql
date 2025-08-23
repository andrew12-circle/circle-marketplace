-- SECURITY FIX: Protect real estate agent personal information
-- Add comprehensive protection for sensitive personal data

-- Block ALL anonymous access to agents table
CREATE POLICY "Block anonymous access to agent data"
ON public.agents
FOR ALL
TO anon
USING (false);

-- Create a secure public view with only professional information
-- Explicitly exclude all personal contact and location data
CREATE VIEW public.agents_public 
WITH (security_invoker = true, security_barrier = true) AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  bio,                     -- Professional bio only
  photo_url,               -- Professional headshot
  brokerage,               -- Company name
  years_active,            -- Experience level
  is_active,               -- Active status
  created_at,
  updated_at
  -- EXPLICITLY EXCLUDED sensitive personal information:
  -- email, phone, address, city, state, zip_code, nmls_id
  -- social_facebook, social_instagram, social_linkedin, social_youtube, social_zillow
FROM public.agents
WHERE is_active = true;

-- Create a detailed view for business partners and authenticated relationships
CREATE VIEW public.agents_business_contact 
WITH (security_invoker = true, security_barrier = true) AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email,                   -- Business email for partnerships
  phone,                   -- Business phone for partnerships
  bio,
  photo_url,
  brokerage,
  years_active,
  is_active,
  -- General location (city, state) but not full address
  city,
  state,
  -- Professional social media only
  social_linkedin,         -- Professional networking
  social_zillow,           -- Real estate profile
  created_at,
  updated_at
  -- STILL EXCLUDED: address, zip_code, nmls_id, personal social media
FROM public.agents
WHERE is_active = true;

-- Grant appropriate permissions
-- Public view: Only for displaying agent professional profiles
GRANT SELECT ON public.agents_public TO authenticated;

-- Business contact view: For users with legitimate business relationships
GRANT SELECT ON public.agents_business_contact TO authenticated;

-- Create more granular RLS policies for the main agents table
-- Drop the overly broad admin policy and replace with more specific ones
DROP POLICY IF EXISTS "Admins can view all agent profiles" ON public.agents;

-- Recreate admin policy with explicit admin check
CREATE POLICY "Admins can manage all agent data"
ON public.agents
FOR ALL
TO authenticated
USING (get_user_admin_status() = true)
WITH CHECK (get_user_admin_status() = true);

-- Add business relationship policy for legitimate access to contact info
CREATE POLICY "Business partners can view agent contact info"
ON public.agents
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND (
    -- Agent themselves
    auth.uid() = user_id
    -- Or users with active business relationships
    OR EXISTS (
      SELECT 1 FROM public.co_pay_requests cpr
      WHERE cpr.agent_id = auth.uid()
        AND cpr.vendor_id IN (
          -- Find vendors the agent has relationships with
          SELECT DISTINCT vendor_id FROM public.co_pay_requests
          WHERE agent_id = agents.user_id
          AND status IN ('approved', 'active', 'completed')
        )
        AND cpr.status IN ('approved', 'active', 'completed')
    )
    -- Or admins
    OR get_user_admin_status() = true
  )
);

-- Log security improvement
INSERT INTO public.security_events (event_type, user_id, event_data)
VALUES (
  'agent_data_protection_enhanced',
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  jsonb_build_object(
    'protection_level', 'comprehensive',
    'personal_data_secured', true,
    'public_view_created', true,
    'business_view_created', true,
    'anonymous_access_blocked', true,
    'timestamp', now()
  )
);