-- Fix the search path security issue for the app_event trigger function
CREATE OR REPLACE FUNCTION public.auto_populate_app_event_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is null but user is authenticated, populate it
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Ensure name is not null (required field)
  IF NEW.name IS NULL OR NEW.name = '' THEN
    RAISE EXCEPTION 'Event name cannot be null or empty';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';