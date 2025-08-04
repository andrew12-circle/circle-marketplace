-- Fix function search_path security warnings
-- Update functions that don't have search_path set properly

-- Function to get user admin status needs search_path set
CREATE OR REPLACE FUNCTION public.get_user_admin_status()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  SELECT COALESCE(profiles.is_admin, false) INTO is_admin
  FROM public.profiles
  WHERE profiles.user_id = auth.uid();
  
  RETURN COALESCE(is_admin, false);
END;
$$;

-- Function to increment failed attempts needs search_path set  
CREATE OR REPLACE FUNCTION public.increment_failed_attempts(p_identifier text, p_attempt_type text DEFAULT 'email'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  max_attempts integer := 5;
  lockout_duration interval := interval '15 minutes';
BEGIN
  -- Insert or update failed attempt count
  INSERT INTO public.login_lockouts (identifier, attempt_type, attempt_count, created_at, updated_at)
  VALUES (p_identifier, p_attempt_type, 1, now(), now())
  ON CONFLICT (identifier, attempt_type) 
  DO UPDATE SET 
    attempt_count = public.login_lockouts.attempt_count + 1,
    updated_at = now(),
    locked_until = CASE 
      WHEN public.login_lockouts.attempt_count + 1 >= max_attempts THEN now() + lockout_duration
      ELSE public.login_lockouts.locked_until
    END;
END;
$$;