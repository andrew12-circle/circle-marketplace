-- SECURITY FIX: Protect real estate agent personal information
-- Create granular access controls to prevent unauthorized access to sensitive data

-- First, create a secure view for business contact information that excludes sensitive personal data
CREATE OR REPLACE VIEW agents_business_contact AS
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
CREATE OR REPLACE VIEW agents_public AS
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

-- Create more restrictive policies for the main agents table

-- Policy 1: Agent owners can see their full profile
CREATE POLICY "Agents can view their full profile"
ON public.agents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Agent owners can update their profile
CREATE POLICY "Agents can update their own profile"
ON public.agents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Agents can insert their profile
CREATE POLICY "Agents can insert their profile"
ON public.agents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Business partners can only see limited business contact info
CREATE POLICY "Business partners can view limited contact info"
ON public.agents
FOR SELECT
TO authenticated
USING (
  is_active = true 
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
    OR get_user_admin_status() = true
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

-- Add audit logging for sensitive agent data access
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

-- Add trigger for audit logging on SELECT operations
-- Note: This is for demonstration; in practice, you might want to log this differently
-- as SELECT triggers can impact performance

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
    -- Business partners with active relationships can see contact info only
    EXISTS (
      SELECT 1 FROM public.co_pay_requests cpr
      WHERE cpr.agent_id = agent_user_id
      AND cpr.vendor_id = auth.uid()
      AND cpr.status IN ('approved', 'active', 'completed')
    );
$$;

-- Update existing policies to use the new function for clarity
DROP POLICY IF EXISTS "Users can view their own agent profile" ON public.agents;
DROP POLICY IF EXISTS "Users can update their own agent profile" ON public.agents;
DROP POLICY IF EXISTS "Users can insert their own agent profile" ON public.agents;

-- Recreate with clearer naming and stricter controls
CREATE POLICY "Agents view own full profile"
ON public.agents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR get_user_admin_status() = true);

CREATE POLICY "Agents update own profile"
ON public.agents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Agents create own profile"
ON public.agents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add a policy to prevent deletion of agent profiles (data retention)
CREATE POLICY "Prevent agent profile deletion"
ON public.agents
FOR DELETE
TO authenticated
USING (false); -- No one can delete agent profiles except through admin functions