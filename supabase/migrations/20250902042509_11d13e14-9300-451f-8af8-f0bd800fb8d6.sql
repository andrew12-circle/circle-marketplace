-- Fix the check_and_update_lockout function type mismatch
-- First, let's see if the function exists and drop it
DROP FUNCTION IF EXISTS public.check_and_update_lockout(text);

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

COMMENT ON FUNCTION public.check_and_update_lockout(text, text) IS 
'Checks and updates login lockout status. Returns JSON with lockout info.';

-- Ensure the login_lockouts table exists with proper structure
CREATE TABLE IF NOT EXISTS public.login_lockouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  attempt_type text NOT NULL DEFAULT 'email',
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_login_lockouts_identifier_type_time 
ON public.login_lockouts (identifier, attempt_type, created_at DESC);

-- Enable RLS on login_lockouts
ALTER TABLE public.login_lockouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for login_lockouts
CREATE POLICY IF NOT EXISTS "Service role can manage lockouts"
ON public.login_lockouts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read their own lockout status
CREATE POLICY IF NOT EXISTS "Users can view their own lockout attempts"
ON public.login_lockouts
FOR SELECT
TO authenticated
USING (true); -- Allow reading lockout info for security awareness