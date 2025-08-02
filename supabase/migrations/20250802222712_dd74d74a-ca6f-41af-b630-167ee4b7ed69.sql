-- Function to calculate distance between two geographic points in miles
CREATE OR REPLACE FUNCTION public.calculate_distance_miles(
  lat1 NUMERIC, lon1 NUMERIC, 
  lat2 NUMERIC, lon2 NUMERIC
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to get agent playbooks excluding those within 50 miles
CREATE OR REPLACE FUNCTION public.get_visible_agent_playbooks(
  viewer_user_id UUID DEFAULT auth.uid()
) RETURNS TABLE (
  content_id UUID,
  distance_miles NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  viewer_lat NUMERIC;
  viewer_lon NUMERIC;
BEGIN
  -- Get viewer's coordinates
  SELECT latitude, longitude INTO viewer_lat, viewer_lon
  FROM public.profiles
  WHERE user_id = viewer_user_id;
  
  -- Return playbooks that are either:
  -- 1. More than 50 miles away from viewer
  -- 2. Have no location data (show by default)
  -- 3. Are from the viewer themselves (can see own content)
  RETURN QUERY
  SELECT 
    c.id as content_id,
    CASE 
      WHEN cp.latitude IS NOT NULL AND cp.longitude IS NOT NULL AND viewer_lat IS NOT NULL AND viewer_lon IS NOT NULL
      THEN public.calculate_distance_miles(viewer_lat, viewer_lon, cp.latitude, cp.longitude)
      ELSE 999999 -- Large distance for missing coordinates
    END as distance_miles
  FROM public.content c
  JOIN public.profiles cp ON c.creator_id = cp.user_id
  WHERE c.is_agent_playbook = true 
    AND c.is_published = true
    AND (
      c.creator_id = viewer_user_id OR -- Own content
      cp.latitude IS NULL OR cp.longitude IS NULL OR -- No location data
      viewer_lat IS NULL OR viewer_lon IS NULL OR -- Viewer has no location
      public.calculate_distance_miles(viewer_lat, viewer_lon, cp.latitude, cp.longitude) > 50 -- More than 50 miles away
    );
END;
$$;

-- Update RLS policy for content table to respect 50-mile rule for agent playbooks
DROP POLICY IF EXISTS "Published content is viewable by everyone" ON public.content;

CREATE POLICY "Published content visibility with location filter" 
ON public.content FOR SELECT 
USING (
  is_published = true AND (
    -- Non-agent playbooks are visible to everyone
    is_agent_playbook = false OR
    -- Agent playbooks follow the 50-mile rule
    (is_agent_playbook = true AND 
     content.id IN (
       SELECT content_id 
       FROM public.get_visible_agent_playbooks(auth.uid())
     )
    )
  )
);

-- Function to update creator location when creating agent playbooks
CREATE OR REPLACE FUNCTION public.update_agent_playbook_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger to automatically set agent location when creating playbooks
DROP TRIGGER IF EXISTS update_agent_playbook_location_trigger ON public.content;
CREATE TRIGGER update_agent_playbook_location_trigger
  BEFORE INSERT OR UPDATE ON public.content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_playbook_location();

-- Update existing agent playbooks to include location data
UPDATE public.content 
SET agent_location = (
  SELECT COALESCE(p.city || ', ' || p.state, p.location)
  FROM public.profiles p
  WHERE p.user_id = content.creator_id
)
WHERE is_agent_playbook = true AND agent_location IS NULL;