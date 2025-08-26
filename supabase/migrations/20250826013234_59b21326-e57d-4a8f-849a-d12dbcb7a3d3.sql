-- Step 1: Demote the duplicate admin account for robert@gocircle.org
UPDATE public.profiles 
SET is_admin = false, 
    updated_at = now()
WHERE user_id = '8559c5c1-25a5-4d53-9711-5c0f6e73513c';

-- Step 2: Add unique constraint to prevent duplicate profiles
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS profiles_user_id_unique 
ON public.profiles (user_id);

-- Step 3: Update admin functions to use LIMIT 1 for safety
CREATE OR REPLACE FUNCTION public.get_user_admin_status(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin BOOLEAN := false;
BEGIN
  -- Safety check for null user
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check profile admin status with LIMIT 1 for safety
  SELECT COALESCE(profiles.is_admin, false) INTO is_admin
  FROM public.profiles 
  WHERE profiles.user_id = p_user_id
  LIMIT 1;
  
  RETURN COALESCE(is_admin, false);
END;
$function$;