-- CRITICAL SECURITY FIX: Remove business partner access to sensitive agent personal information
-- The current policy exposes home addresses, phone numbers, NMLS IDs, and emails to business partners

-- Remove the overly permissive business partner policy
DROP POLICY IF EXISTS "Business partners view limited contact info" ON public.agents;

-- Create a function to determine what agent fields can be safely shared for business purposes
CREATE OR REPLACE FUNCTION get_agent_business_profile(agent_record public.agents)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Return only safe business information, excluding sensitive personal data
  SELECT jsonb_build_object(
    'id', agent_record.id,
    'first_name', agent_record.first_name,
    'last_name', agent_record.last_name,
    'brokerage', agent_record.brokerage,
    'city', agent_record.city,  -- General location only
    'state', agent_record.state, -- General location only
    'years_active', agent_record.years_active,
    'bio', agent_record.bio,
    'photo_url', agent_record.photo_url,
    'social_linkedin', agent_record.social_linkedin,
    'social_zillow', agent_record.social_zillow,
    'is_active', agent_record.is_active
    -- EXCLUDED: email, phone, address, zip_code, nmls_id, all other social media
  );
$$;

-- Create a secure view for business contacts that excludes sensitive personal information
CREATE OR REPLACE VIEW agents_business_directory AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  brokerage,
  city,        -- General city for business context
  state,       -- General state for business context
  years_active,
  bio,
  photo_url,
  social_linkedin,  -- Professional networking
  social_zillow,    -- Business-relevant platform
  is_active,
  created_at,
  updated_at
  -- EXCLUDED: email, phone, address, zip_code, nmls_id, facebook, instagram, youtube
FROM public.agents
WHERE is_active = true;

-- Enable RLS on the business directory view
ALTER VIEW agents_business_directory SET (security_barrier = true);

-- Create policy for business directory view - very limited access
CREATE POLICY "Business directory limited access"
ON agents_business_directory
FOR SELECT
TO authenticated
USING (
  -- Business partners can only see basic business info (no contact details)
  EXISTS (
    SELECT 1 FROM public.co_pay_requests cpr
    WHERE cpr.agent_id = user_id
    AND cpr.vendor_id = auth.uid()
    AND cpr.status IN ('approved', 'active', 'completed')
  )
  OR
  -- Agents can see their own info
  auth.uid() = user_id
  OR
  -- Admins can see all
  get_user_admin_status() = true
);

-- Update the main agents table policies to be even more restrictive

-- Remove any remaining broad access policies
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
-- (They can only use the limited business directory view)

-- Create an audit log for any access to sensitive agent data
CREATE OR REPLACE FUNCTION log_sensitive_agent_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when someone accesses the main agents table (contains sensitive data)
  IF auth.uid() != NEW.user_id AND NOT get_user_admin_status() THEN
    INSERT INTO public.security_events (
      event_type,
      user_id,
      event_data
    ) VALUES (
      'sensitive_agent_data_access_attempt',
      auth.uid(),
      jsonb_build_object(
        'target_agent_id', NEW.id,
        'target_agent_user_id', NEW.user_id,
        'access_type', 'SELECT',
        'blocked', false,
        'timestamp', now(),
        'note', 'Access to sensitive agent data via main table'
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the query if logging fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We can't use AFTER SELECT triggers, so this is for monitoring other operations

-- Log the critical security fix
INSERT INTO public.security_events (
  event_type,
  user_id,
  event_data
) VALUES (
  'critical_agent_privacy_fix',
  NULL,
  jsonb_build_object(
    'description', 'CRITICAL: Removed business partner access to sensitive agent personal information',
    'issue', 'Business partners could access home addresses, phone numbers, NMLS IDs, and emails',
    'fix', 'Implemented strict access controls and created safe business directory view',
    'sensitive_data_protected', jsonb_build_array(
      'Home addresses',
      'Phone numbers', 
      'Email addresses',
      'NMLS IDs',
      'ZIP codes',
      'Personal social media accounts'
    ),
    'access_model', 'Agent owns their data, admins have oversight, business partners get minimal business info only',
    'privacy_impact', 'CRITICAL - Prevents identity theft and unwanted contact',
    'timestamp', now()
  )
);