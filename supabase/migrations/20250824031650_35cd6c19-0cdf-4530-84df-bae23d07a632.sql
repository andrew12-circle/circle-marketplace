-- Fix admin authentication by adding session bootstrap function
-- This creates or refreshes admin sessions when needed

CREATE OR REPLACE FUNCTION public.start_admin_session()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  user_is_admin boolean;
BEGIN
  -- Check if user exists and is admin
  SELECT is_admin INTO user_is_admin
  FROM public.profiles 
  WHERE user_id = current_user_id;
  
  IF NOT COALESCE(user_is_admin, false) THEN
    RETURN false;
  END IF;
  
  -- Create or refresh admin session
  INSERT INTO public.admin_sessions (
    user_id,
    session_token,
    expires_at,
    last_activity,
    ip_address,
    user_agent
  ) VALUES (
    current_user_id,
    encode(gen_random_bytes(32), 'hex'),
    now() + interval '30 minutes',
    now(),
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    expires_at = now() + interval '30 minutes',
    last_activity = now(),
    updated_at = now();
    
  RETURN true;
END;
$$;