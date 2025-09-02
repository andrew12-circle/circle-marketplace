-- Update login_lockouts table structure for UPSERT-based lockout
ALTER TABLE public.login_lockouts 
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ DEFAULT now();

-- Create unique index for UPSERT operations
CREATE UNIQUE INDEX IF NOT EXISTS login_lockouts_identifier_type_idx 
ON public.login_lockouts (identifier, attempt_type);

-- Replace the lockout function with idempotent UPSERT version
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
  v_attempts integer := 0;
  v_lockout_time timestamptz;
BEGIN
  -- Get current attempt count within window
  SELECT attempt_count, last_attempt_at
  INTO v_attempts, v_lockout_time
  FROM public.login_lockouts
  WHERE identifier = p_identifier
    AND attempt_type = p_attempt_type
    AND last_attempt_at >= (v_now - v_window);

  -- Check if locked out
  IF v_attempts >= v_max_attempts AND v_lockout_time IS NOT NULL THEN
    DECLARE
      v_time_remaining integer := EXTRACT(epoch FROM ((v_lockout_time + v_window) - v_now))::integer;
    BEGIN
      IF v_time_remaining > 0 THEN
        RETURN jsonb_build_object(
          'is_locked', true,
          'attempts_remaining', 0,
          'time_remaining_seconds', v_time_remaining,
          'lockout_expires_at', v_lockout_time + v_window
        );
      ELSE
        -- Lockout expired, reset
        v_attempts := 0;
      END IF;
    END;
  END IF;

  -- UPSERT attempt record (idempotent)
  INSERT INTO public.login_lockouts (identifier, attempt_type, attempt_count, last_attempt_at)
  VALUES (p_identifier, p_attempt_type, 1, v_now)
  ON CONFLICT (identifier, attempt_type) 
  DO UPDATE SET
    attempt_count = CASE 
      WHEN login_lockouts.last_attempt_at < (v_now - v_window) THEN 1
      ELSE login_lockouts.attempt_count + 1
    END,
    last_attempt_at = v_now;

  -- Get updated count
  SELECT attempt_count INTO v_attempts
  FROM public.login_lockouts
  WHERE identifier = p_identifier AND attempt_type = p_attempt_type;

  -- Return status
  RETURN jsonb_build_object(
    'is_locked', v_attempts >= v_max_attempts,
    'attempts_remaining', GREATEST(0, v_max_attempts - v_attempts),
    'time_remaining_seconds', CASE 
      WHEN v_attempts >= v_max_attempts THEN EXTRACT(epoch FROM v_window)::integer
      ELSE 0 
    END,
    'lockout_expires_at', CASE 
      WHEN v_attempts >= v_max_attempts THEN v_now + v_window
      ELSE null 
    END
  );
END;
$$;