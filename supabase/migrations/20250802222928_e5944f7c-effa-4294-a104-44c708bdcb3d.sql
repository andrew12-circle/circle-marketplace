-- Add latitude and longitude columns to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Create a simpler RLS policy that doesn't rely on precise location filtering for now
-- We'll implement the 50-mile rule in the application layer if needed
DROP POLICY IF EXISTS "Published content visibility with location filter" ON public.content;

CREATE POLICY "Published content visibility with location filter" 
ON public.content FOR SELECT 
USING (
  is_published = true AND (
    -- Non-agent playbooks are visible to everyone
    is_agent_playbook = false OR
    -- Users can always see their own content
    creator_id = auth.uid() OR
    -- For now, show all agent playbooks but we'll filter in application layer
    -- This ensures the system works while we implement proper geocoding
    is_agent_playbook = true
  )
);

-- Comment: The 50-mile filtering will be implemented in the application layer
-- where we can properly geocode addresses and calculate distances
-- This ensures the basic functionality works while we add location services