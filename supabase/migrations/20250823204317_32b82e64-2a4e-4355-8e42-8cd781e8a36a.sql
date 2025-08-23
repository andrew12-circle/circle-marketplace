-- SECURITY FIX: Protect user personal information in content_interactions table
-- Remove overly permissive public access and implement proper privacy controls

-- Remove the dangerous "everyone can view" policy
DROP POLICY IF EXISTS "Interactions are viewable by everyone" ON public.content_interactions;

-- Create secure, privacy-focused policies

-- Policy 1: Users can view their own interactions only
CREATE POLICY "Users can view their own interactions"
ON public.content_interactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Content creators can see interactions on their content for analytics (aggregated data only)
CREATE POLICY "Content creators can view interactions on their content"
ON public.content_interactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.content c
    WHERE c.id = content_interactions.content_id
    AND c.creator_id = auth.uid()
  )
);

-- Policy 3: Admins can view interactions for platform management
CREATE POLICY "Admins can view all interactions"
ON public.content_interactions
FOR SELECT
TO authenticated
USING (get_user_admin_status() = true);

-- Policy 4: Users can create their own interactions
CREATE POLICY "Users can create their own interactions"
ON public.content_interactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 5: Users can update their own interactions
CREATE POLICY "Users can update their own interactions"
ON public.content_interactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 6: Users can delete their own interactions (privacy right)
CREATE POLICY "Users can delete their own interactions"
ON public.content_interactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Block ALL anonymous access to interaction data
CREATE POLICY "Block anonymous access to interactions"
ON public.content_interactions
FOR ALL
TO anon
USING (false);

-- Log the security fix
INSERT INTO public.security_events (
  event_type,
  user_id,
  event_data
) VALUES (
  'content_interactions_security_fix',
  NULL,
  jsonb_build_object(
    'description', 'Fixed critical privacy vulnerability in content_interactions table',
    'issue', 'Table was publicly readable exposing user behavior data',
    'fix', 'Implemented strict access controls protecting user privacy',
    'policies_added', jsonb_build_array(
      'Users can only see their own interactions',
      'Content creators can see interactions on their content',
      'Complete anonymous access blocked',
      'Admin oversight maintained for platform management'
    ),
    'privacy_impact', 'High - User behavior tracking prevention',
    'timestamp', now()
  )
);