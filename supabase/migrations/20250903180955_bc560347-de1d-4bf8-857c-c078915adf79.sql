-- Fix app_events RLS policy to handle auth state issues more gracefully
DROP POLICY IF EXISTS "users can insert own events" ON public.app_events;

-- Create a more resilient policy that allows:
-- 1. Events where user_id matches auth.uid() (normal case)
-- 2. Events with NULL user_id when auth.uid() is available (let trigger handle it)
-- 3. Events where user_id is auth.uid() and both are valid
CREATE POLICY "users can insert events resilient" ON public.app_events
FOR INSERT WITH CHECK (
  -- Allow if user_id matches authenticated user
  (user_id = auth.uid() AND auth.uid() IS NOT NULL)
  OR
  -- Allow if user_id is null and user is authenticated (will be auto-populated)
  (user_id IS NULL AND auth.uid() IS NOT NULL)
);

-- Create a trigger to auto-populate user_id if it's null during insert
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger
DROP TRIGGER IF EXISTS auto_populate_app_event_user_id_trigger ON public.app_events;
CREATE TRIGGER auto_populate_app_event_user_id_trigger
  BEFORE INSERT ON public.app_events
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_app_event_user_id();