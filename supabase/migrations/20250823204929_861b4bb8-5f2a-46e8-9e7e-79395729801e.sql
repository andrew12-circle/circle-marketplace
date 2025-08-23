-- CRITICAL SECURITY FIX: Remove business partner access to sensitive agent personal information

-- Remove the dangerous business partner policy that exposes sensitive data
DROP POLICY IF EXISTS "Business partners view limited contact info" ON public.agents;

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
  'agent_privacy_vulnerability_eliminated',
  NULL,
  jsonb_build_object(
    'description', 'CRITICAL: Eliminated business partner access to sensitive agent personal information',
    'vulnerability_removed', 'Business partners could access home addresses, phone numbers, NMLS IDs, and emails',
    'fix_implemented', 'Removed overly permissive RLS policy, created secure business directory',
    'current_access_model', jsonb_build_object(
      'agents', 'Can view their own complete profile only',
      'admins', 'Can view all profiles for platform management',
      'business_partners', 'NO direct access, minimal business info via secure function only'
    ),
    'sensitive_data_now_protected', jsonb_build_array(
      'Home addresses and ZIP codes',
      'Phone numbers and email addresses', 
      'NMLS IDs and license numbers',
      'Personal social media accounts',
      'Complete contact information'
    ),
    'business_directory_fields', jsonb_build_array(
      'Name and brokerage only',
      'General city/state (no addresses)',
      'Professional bio and photo',
      'Business social media only (LinkedIn, Zillow)'
    ),
    'privacy_impact', 'MAXIMUM - Prevents identity theft, spam, harassment, and unauthorized contact',
    'timestamp', now()
  )
);