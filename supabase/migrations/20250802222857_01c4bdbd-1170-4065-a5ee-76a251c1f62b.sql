-- Update the RLS policy with correct column references
DROP POLICY IF EXISTS "Published content visibility with location filter" ON public.content;

CREATE POLICY "Published content visibility with location filter" 
ON public.content FOR SELECT 
USING (
  is_published = true AND (
    -- Non-agent playbooks are visible to everyone
    is_agent_playbook = false OR
    -- Users can always see their own content
    creator_id = auth.uid() OR
    -- Agent playbooks with location restriction
    (is_agent_playbook = true AND EXISTS (
      SELECT 1 
      FROM public.profiles viewer_profile, public.profiles creator_profile
      WHERE viewer_profile.user_id = auth.uid()
        AND creator_profile.user_id = content.creator_id
        AND (
          -- Show if either profile has no coordinates (using correct column names)
          viewer_profile.longitude IS NULL OR viewer_profile.latitude IS NULL OR
          creator_profile.longitude IS NULL OR creator_profile.latitude IS NULL OR
          -- Show if distance is greater than 50 miles
          public.calculate_distance_miles(
            viewer_profile.latitude, viewer_profile.longitude,
            creator_profile.latitude, creator_profile.longitude
          ) > 50
        )
    ))
  )
);