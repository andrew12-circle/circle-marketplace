-- Fix the check_and_update_lockout function with proper timestamp handling
DROP FUNCTION IF EXISTS check_and_update_lockout(text, text);

CREATE OR REPLACE FUNCTION check_and_update_lockout(
  p_identifier text,
  p_attempt_type text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  lockout_record record;
  current_time timestamptz := now();
  max_attempts integer := 5;
  lockout_duration interval := interval '15 minutes';
  result json;
BEGIN
  -- Get or create lockout record
  INSERT INTO public.login_lockouts (identifier, attempt_type, attempt_count, created_at, updated_at)
  VALUES (p_identifier, p_attempt_type, 0, current_time, current_time)
  ON CONFLICT (identifier, attempt_type) 
  DO UPDATE SET updated_at = current_time
  RETURNING * INTO lockout_record;
  
  -- Check if currently locked out
  IF lockout_record.locked_until IS NOT NULL AND lockout_record.locked_until > current_time THEN
    result := json_build_object(
      'is_locked', true,
      'locked_until', lockout_record.locked_until,
      'attempt_count', lockout_record.attempt_count,
      'attempts_remaining', GREATEST(0, max_attempts - lockout_record.attempt_count),
      'time_remaining_seconds', EXTRACT(epoch FROM (lockout_record.locked_until - current_time))::integer
    );
  ELSE
    -- Not locked out or lockout expired
    IF lockout_record.locked_until IS NOT NULL AND lockout_record.locked_until <= current_time THEN
      -- Reset if lockout expired
      UPDATE public.login_lockouts 
      SET attempt_count = 0, locked_until = NULL, updated_at = current_time
      WHERE identifier = p_identifier AND attempt_type = p_attempt_type;
      
      lockout_record.attempt_count := 0;
      lockout_record.locked_until := NULL;
    END IF;
    
    result := json_build_object(
      'is_locked', false,
      'locked_until', lockout_record.locked_until,
      'attempt_count', lockout_record.attempt_count,
      'attempts_remaining', GREATEST(0, max_attempts - lockout_record.attempt_count),
      'time_remaining_seconds', 0
    );
  END IF;
  
  RETURN result;
END;
$$;