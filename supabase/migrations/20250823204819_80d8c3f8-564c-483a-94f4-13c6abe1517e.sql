-- CRITICAL SECURITY FIX: Remove business partner access to sensitive agent personal information
-- The current policy exposes home addresses, phone numbers, NMLS IDs, and emails to business partners

-- Remove the overly permissive business partner policy that gives access to sensitive data
DROP POLICY IF EXISTS "Business partners view limited contact info" ON public.agents;

-- Remove any overly broad policies
DROP POLICY IF EXISTS "Agents view own full profile" ON public.agents;

-- Create highly restrictive policies for the main agents table

-- Policy 1: Agents can view their own full profile ONLY
CREATE POLICY "Agents view own complete profile"
ON public.agents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Admins can view all for platform management
CREATE POLICY "Admins view all agent profiles"
ON public.agents
FOR SELECT
TO authenticated
USING (get_user_admin_status() = true);

-- Policy 3: NO business partner access to main agents table
-- Business partners will no longer have any access to the sensitive agents table

-- Create a secure business directory view that excludes all sensitive information
CREATE OR REPLACE VIEW agents_business_directory AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  brokerage,
  city,        -- General city for business context only
  state,       -- General state for business context only
  years_active,
  bio,
  photo_url,
  social_linkedin,  -- Professional networking only
  social_zillow,    -- Business-relevant platform only
  is_active,
  created_at,
  updated_at
  -- STRICTLY EXCLUDED: email, phone, address, zip_code, nmls_id, 
  -- facebook, instagram, youtube (personal social media)
FROM public.agents
WHERE is_active = true;

-- Create a function that business partners can use to get very limited agent info
-- This function enforces the business relationship requirement and data minimization
CREATE OR REPLACE FUNCTION get_business_agent_info(target_agent_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.co_pay_requests cpr
        WHERE cpr.agent_id = target_agent_user_id
        AND cpr.vendor_id = auth.uid()
        AND cpr.status IN ('approved', 'active', 'completed')
      ) OR get_user_admin_status() = true
      THEN 
        -- Return minimal business info only - NO contact details
        (SELECT jsonb_build_object(
          'first_name', first_name,
          'last_name', last_name,
          'brokerage', brokerage,
          'city', city,
          'state', state,
          'years_active', years_active,
          'bio', bio,
          'is_active', is_active
          -- EXCLUDED: All contact info, addresses, IDs, personal social media
        ) FROM public.agents WHERE user_id = target_agent_user_id)
      ELSE 
        NULL
    END;
$$;

-- Log the critical security fix
INSERT INTO public.security_events (
  event_type,
  user_id,
  event_data
) VALUES (
  'critical_agent_privacy_fix_completed',
  NULL,
  jsonb_build_object(
    'description', 'CRITICAL: Eliminated business partner access to sensitive agent personal information',
    'previous_vulnerability', 'Business partners could access home addresses, phone numbers, NMLS IDs, and emails through RLS policy',
    'fix_implemented', 'Completely removed business partner access to main agents table',
    'new_access_model', jsonb_build_object(
      'agents', 'Can view their own complete profile',
      'admins', 'Can view all profiles for platform management',
      'business_partners', 'NO access to main table, minimal business info only via secure function'
    ),
    'sensitive_data_now_protected', jsonb_build_array(
      'Home addresses and ZIP codes',
      'Phone numbers and email addresses', 
      'NMLS IDs and license numbers',
      'Personal social media accounts (Facebook, Instagram, YouTube)',
      'Complete contact information'
    ),
    'business_access', 'Severely restricted to basic business context only (name, brokerage, general location)',
    'privacy_impact', 'MAXIMUM - Prevents identity theft, spam, harassment, and unauthorized contact',
    'compliance_benefit', 'Aligns with privacy regulations and professional standards',
    'timestamp', now()
  )
);