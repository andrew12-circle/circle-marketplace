-- Drop the get_visible_agent_playbooks function completely since we're not using it
DROP FUNCTION IF EXISTS public.get_visible_agent_playbooks(UUID);

-- Update the trigger function to remove SECURITY DEFINER
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