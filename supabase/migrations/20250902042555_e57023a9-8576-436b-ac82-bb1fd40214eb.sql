-- Drop the existing function with correct signature
DROP FUNCTION IF EXISTS public.check_and_update_lockout(text, text);

-- Create a new improved lockout function
CREATE OR REPLACE FUNCTION public.check_and_update_lockout(
  p_identifier text, 
  p_attempt_type text DEFAULT 'email'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_now timestamptz := now();
  v_window interval := interval '15 minutes';
  v_max_attempts integer := 5;
  v_recent_attempts integer;
  v_lockout_time timestamptz;
  v_time_remaining integer;
BEGIN
  -- Count recent failed attempts
  SELECT COUNT(*), MAX(created_at)
  INTO v_recent_attempts, v_lockout_time
  FROM public.login_lockouts
  WHERE identifier = p_identifier
    AND attempt_type = p_attempt_type
    AND created_at >= (v_now - v_window);

  -- Calculate time remaining if locked out
  IF v_recent_attempts >= v_max_attempts AND v_lockout_time IS NOT NULL THEN
    v_time_remaining := EXTRACT(epoch FROM ((v_lockout_time + v_window) - v_now))::integer;
    
    IF v_time_remaining > 0 THEN
      -- Still locked out
      RETURN jsonb_build_object(
        'is_locked', true,
        'attempts_remaining', 0,
        'time_remaining_seconds', v_time_remaining,
        'lockout_expires_at', v_lockout_time + v_window
      );
    ELSE
      -- Lockout expired, clear old attempts
      DELETE FROM public.login_lockouts 
      WHERE identifier = p_identifier 
        AND attempt_type = p_attempt_type 
        AND created_at < (v_now - v_window);
      v_recent_attempts := 0;
    END IF;
  END IF;

  -- Record this attempt (only if not already locked out)
  IF v_recent_attempts < v_max_attempts THEN
    INSERT INTO public.login_lockouts (identifier, attempt_type, created_at)
    VALUES (p_identifier, p_attempt_type, v_now);
    
    v_recent_attempts := v_recent_attempts + 1;
  END IF;

  -- Return status
  RETURN jsonb_build_object(
    'is_locked', v_recent_attempts >= v_max_attempts,
    'attempts_remaining', GREATEST(0, v_max_attempts - v_recent_attempts),
    'time_remaining_seconds', CASE 
      WHEN v_recent_attempts >= v_max_attempts THEN EXTRACT(epoch FROM v_window)::integer
      ELSE 0 
    END,
    'lockout_expires_at', CASE 
      WHEN v_recent_attempts >= v_max_attempts THEN v_now + v_window
      ELSE null 
    END
  );
END;
$$;