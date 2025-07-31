-- Update clear_failed_attempts function to use consistent parameter names
DROP FUNCTION IF EXISTS clear_failed_attempts(text, text);

CREATE OR REPLACE FUNCTION clear_failed_attempts(
  p_identifier text, 
  p_attempt_type text DEFAULT 'email'::text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.login_lockouts 
  WHERE identifier = p_identifier 
    AND attempt_type = p_attempt_type;
END;
$$;