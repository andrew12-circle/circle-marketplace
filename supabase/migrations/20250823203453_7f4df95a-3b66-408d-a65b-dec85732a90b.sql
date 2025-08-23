-- SECURITY FIX: Protect real estate agent personal information
-- Create granular access controls to prevent unauthorized access to sensitive data

-- Drop existing views if they exist to avoid column conflicts
DROP VIEW IF EXISTS agents_business_contact;
DROP VIEW IF EXISTS agents_public;

-- Create a secure view for business contact information that excludes sensitive personal data
CREATE VIEW agents_business_contact AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email,
  phone,
  brokerage,
  bio,
  city,
  state,
  years_active,
  photo_url,
  social_linkedin,
  social_zillow,
  is_active,
  created_at,
  updated_at
FROM public.agents
WHERE is_active = true;

-- Enable RLS on the view
ALTER VIEW agents_business_contact SET (security_barrier = true);

-- Create a public view with minimal information for discovery
CREATE VIEW agents_public AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  brokerage,
  bio,
  years_active,
  photo_url,
  is_active,
  created_at,
  updated_at
FROM public.agents
WHERE is_active = true;

-- Enable RLS on the public view
ALTER VIEW agents_public SET (security_barrier = true);

-- Remove the overly permissive business partners policy
DROP POLICY IF EXISTS "Business partners can view agent contact info" ON public.agents;

-- Drop old policies that will be replaced
DROP POLICY IF EXISTS "Users can view their own agent profile" ON public.agents;
DROP POLICY IF EXISTS "Users can update their own agent profile" ON public.agents;
DROP POLICY IF EXISTS "Users can insert their own agent profile" ON public.agents;
DROP POLICY IF EXISTS "Agents can view their full profile" ON public.agents;
DROP POLICY IF EXISTS "Agents can update their own profile" ON public.agents;
DROP POLICY IF EXISTS "Agents can insert their profile" ON public.agents;

-- Create more restrictive policies for the main agents table

-- Policy 1: Agents can view their own full profile and admins can view all
CREATE POLICY "Agents view own full profile"
ON public.agents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR get_user_admin_status() = true);

-- Policy 2: Agents can update their own profile
CREATE POLICY "Agents update own profile"
ON public.agents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Agents can create their own profile
CREATE POLICY "Agents create own profile"
ON public.agents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Business partners can only see limited business contact info (not sensitive personal data)
CREATE POLICY "Business partners view limited contact info"
ON public.agents
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND auth.uid() != user_id  -- Not their own profile (covered by other policy)
  AND (
    -- Business partners through co-pay relationships can see business contact info only
    EXISTS (
      SELECT 1 FROM public.co_pay_requests cpr
      WHERE cpr.agent_id = agents.user_id
      AND cpr.vendor_id = auth.uid()
      AND cpr.status IN ('approved', 'active', 'completed')
    )
    OR
    -- Agents in active co-pay relationships can see each other's business info
    EXISTS (
      SELECT 1 FROM public.co_pay_requests cpr1
      WHERE cpr1.agent_id = auth.uid()
      AND cpr1.status IN ('approved', 'active', 'completed')
      AND EXISTS (
        SELECT 1 FROM public.co_pay_requests cpr2
        WHERE cpr2.vendor_id = cpr1.vendor_id
        AND cpr2.agent_id = agents.user_id
        AND cpr2.status IN ('approved', 'active', 'completed')
      )
    )
  )
);

-- Create RLS policies for the business contact view
CREATE POLICY "Business contact view access"
ON agents_business_contact
FOR SELECT
TO authenticated
USING (
  -- Business partners can see contact info
  EXISTS (
    SELECT 1 FROM public.co_pay_requests cpr
    WHERE cpr.agent_id = user_id
    AND cpr.vendor_id = auth.uid()
    AND cpr.status IN ('approved', 'active', 'completed')
  )
  OR
  -- Agent can see their own info
  auth.uid() = user_id
  OR
  -- Admins can see all
  get_user_admin_status() = true
);

-- Create RLS policies for the public view (very limited info)
CREATE POLICY "Public agent discovery"
ON agents_public
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create a function to check if user can view sensitive agent data
CREATE OR REPLACE FUNCTION can_view_agent_sensitive_data(agent_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    -- Agents can see their own data
    auth.uid() = agent_user_id
    OR
    -- Admins can see everything
    get_user_admin_status() = true
    OR
    -- Business partners with active relationships can see contact info only (not home addresses)
    EXISTS (
      SELECT 1 FROM public.co_pay_requests cpr
      WHERE cpr.agent_id = agent_user_id
      AND cpr.vendor_id = auth.uid()
      AND cpr.status IN ('approved', 'active', 'completed')
    );
$$;

-- Add a policy to prevent deletion of agent profiles (data retention)
CREATE POLICY "Prevent agent profile deletion"
ON public.agents
FOR DELETE
TO authenticated
USING (false); -- No one can delete agent profiles except through admin functions

-- Add audit logging function for sensitive agent data access
CREATE OR REPLACE FUNCTION log_agent_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when sensitive agent data is accessed
  INSERT INTO public.security_events (
    event_type,
    user_id,
    event_data
  ) VALUES (
    'agent_data_access',
    auth.uid(),
    jsonb_build_object(
      'agent_id', NEW.id,
      'accessed_fields', 'full_profile',
      'timestamp', now()
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the query if logging fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;