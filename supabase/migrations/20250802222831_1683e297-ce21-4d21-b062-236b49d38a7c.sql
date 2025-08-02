-- Remove security definer from the distance calculation function since it doesn't need elevated privileges
CREATE OR REPLACE FUNCTION public.calculate_distance_miles(
  lat1 NUMERIC, lon1 NUMERIC, 
  lat2 NUMERIC, lon2 NUMERIC
) RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  r NUMERIC := 3959; -- Earth's radius in miles
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
  distance NUMERIC;
BEGIN
  -- Handle null coordinates
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN 999999; -- Return large distance for null coordinates
  END IF;
  
  -- Convert latitude and longitude from degrees to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  distance := r * c;
  
  RETURN distance;
END;
$$;

-- Update the RLS policy to be simpler and avoid the function that required security definer
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
          -- Show if either profile has no coordinates
          viewer_profile.latitude IS NULL OR viewer_profile.longitude IS NULL OR
          creator_profile.latitude IS NULL OR creator_profile.longitude IS NULL OR
          -- Show if distance is greater than 50 miles
          public.calculate_distance_miles(
            viewer_profile.latitude, viewer_profile.longitude,
            creator_profile.latitude, creator_profile.longitude
          ) > 50
        )
    ))
  )
);

-- Remove the security definer function that was causing the warning
DROP FUNCTION IF EXISTS public.get_visible_agent_playbooks(UUID);

-- Update the location trigger function to remove security definer
CREATE OR REPLACE FUNCTION public.update_agent_playbook_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  creator_location_data RECORD;
BEGIN
  -- Only apply to agent playbooks
  IF NEW.is_agent_playbook = true THEN
    -- Get creator's location data
    SELECT 
      location, city, state, zip_code, latitude, longitude,
      COALESCE(city || ', ' || state, location) as formatted_location
    INTO creator_location_data
    FROM public.profiles
    WHERE user_id = NEW.creator_id;
    
    -- Update the content with creator's location
    NEW.agent_location := creator_location_data.formatted_location;
  END IF;
  
  RETURN NEW;
END;
$$;