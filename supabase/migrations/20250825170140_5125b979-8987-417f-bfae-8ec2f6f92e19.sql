
-- 1) Ensure one admin session per user so ON CONFLICT works
ALTER TABLE public.admin_sessions
ADD CONSTRAINT admin_sessions_user_id_key UNIQUE (user_id);

-- 2) Fix start_admin_session: remove invalid updated_at reference and upsert by user_id
CREATE OR REPLACE FUNCTION public.start_admin_session()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  user_is_admin boolean;
  hdr jsonb;
  xff text;
  ua text;
BEGIN
  -- Confirm the caller is an admin
  SELECT is_admin INTO user_is_admin
  FROM public.profiles
  WHERE user_id = current_user_id;

  IF NOT COALESCE(user_is_admin, false) THEN
    RETURN false;
  END IF;

  -- Safely read request headers if available (works via PostgREST)
  hdr := NULLIF(current_setting('request.headers', true), '')::jsonb;
  xff := COALESCE(hdr->>'x-forwarded-for', NULL);
  ua  := COALESCE(hdr->>'user-agent', NULL);

  -- Create or refresh session for this admin user
  INSERT INTO public.admin_sessions (
    user_id,
    session_token,
    created_at,
    last_activity,
    expires_at,
    ip_address,
    user_agent
  )
  VALUES (
    current_user_id,
    encode(gen_random_bytes(32), 'hex'),
    now(),
    now(),
    now() + interval '30 minutes',
    COALESCE(public.clean_ip_address(xff), inet_client_addr()),
    ua
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_activity = now(),
    expires_at    = now() + interval '30 minutes',
    -- only overwrite if new info available
    ip_address    = COALESCE(EXCLUDED.ip_address, public.admin_sessions.ip_address),
    user_agent    = COALESCE(EXCLUDED.user_agent, public.admin_sessions.user_agent);

  RETURN true;
END;
$$;
