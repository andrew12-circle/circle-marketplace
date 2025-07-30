-- Fix security issues by dropping and recreating functions, and implementing critical security enhancements

-- 1. Fix the security definer view by recreating as regular view
DROP VIEW IF EXISTS public.vendors_with_local_reps;
CREATE VIEW public.vendors_with_local_reps AS
SELECT 
  v.*,
  CASE 
    WHEN v.vendor_type = 'individual' THEN 
      jsonb_build_array(
        jsonb_build_object(
          'name', v.individual_name,
          'title', v.individual_title,
          'email', v.individual_email,
          'phone', v.individual_phone,
          'license_number', v.individual_license_number
        )
      )
    ELSE '[]'::jsonb
  END as local_representatives
FROM public.vendors v
WHERE v.is_active = true;

-- 2. Drop and recreate password strength validation with enhanced features
DROP FUNCTION IF EXISTS public.validate_password_strength(text);
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  score integer := 0;
  feedback text[] := ARRAY[]::text[];
BEGIN
  -- Length check
  IF length(password) >= 12 THEN
    score := score + 2;
  ELSIF length(password) >= 8 THEN
    score := score + 1;
  ELSE
    feedback := array_append(feedback, 'Password must be at least 8 characters long');
  END IF;
  
  -- Uppercase check
  IF password ~ '[A-Z]' THEN
    score := score + 1;
  ELSE
    feedback := array_append(feedback, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Lowercase check
  IF password ~ '[a-z]' THEN
    score := score + 1;
  ELSE
    feedback := array_append(feedback, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Number check
  IF password ~ '[0-9]' THEN
    score := score + 1;
  ELSE
    feedback := array_append(feedback, 'Password must contain at least one number');
  END IF;
  
  -- Special character check
  IF password ~ '[^A-Za-z0-9]' THEN
    score := score + 1;
  ELSE
    feedback := array_append(feedback, 'Password must contain at least one special character');
  END IF;
  
  -- Common password check
  IF lower(password) IN ('password', '123456', 'qwerty', 'letmein', 'welcome') THEN
    score := score - 2;
    feedback := array_append(feedback, 'Password is too common');
  END IF;
  
  RETURN jsonb_build_object(
    'is_strong', score >= 4 AND array_length(feedback, 1) IS NULL,
    'score', score,
    'max_score', 6,
    'feedback', to_jsonb(feedback)
  );
END;
$$;

-- 3. Create table for failed login tracking
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL, -- email or IP
  attempt_type text NOT NULL DEFAULT 'email', -- 'email' or 'ip'
  attempts_count integer DEFAULT 1,
  last_attempt_at timestamp with time zone DEFAULT now(),
  locked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on failed login attempts
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view failed login attempts" ON public.failed_login_attempts;
DROP POLICY IF EXISTS "System can manage failed login attempts" ON public.failed_login_attempts;

-- Only admins can view failed login attempts
CREATE POLICY "Admins can view failed login attempts"
ON public.failed_login_attempts
FOR SELECT
USING (get_user_admin_status());

-- System can manage failed login attempts
CREATE POLICY "System can manage failed login attempts"
ON public.failed_login_attempts
FOR ALL
USING (false)
WITH CHECK (false);

-- 4. Enhanced account lockout function with progressive timeouts
CREATE OR REPLACE FUNCTION public.check_and_update_lockout(
  identifier text,
  attempt_type text DEFAULT 'email'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_record record;
  lockout_duration interval;
  is_locked boolean := false;
  time_remaining integer := 0;
BEGIN
  -- Get current failed attempts record
  SELECT * INTO current_record 
  FROM public.failed_login_attempts 
  WHERE identifier = check_and_update_lockout.identifier 
    AND attempt_type = check_and_update_lockout.attempt_type;
  
  -- If no record exists, create one
  IF current_record IS NULL THEN
    INSERT INTO public.failed_login_attempts (identifier, attempt_type, attempts_count)
    VALUES (check_and_update_lockout.identifier, check_and_update_lockout.attempt_type, 1);
    
    RETURN jsonb_build_object(
      'is_locked', false,
      'attempts_remaining', 4,
      'time_remaining_seconds', 0
    );
  END IF;
  
  -- Check if currently locked
  IF current_record.locked_until IS NOT NULL AND current_record.locked_until > now() THEN
    time_remaining := extract(epoch from (current_record.locked_until - now()))::integer;
    RETURN jsonb_build_object(
      'is_locked', true,
      'attempts_remaining', 0,
      'time_remaining_seconds', time_remaining
    );
  END IF;
  
  -- Reset if last attempt was more than 15 minutes ago
  IF current_record.last_attempt_at < now() - interval '15 minutes' THEN
    UPDATE public.failed_login_attempts 
    SET attempts_count = 1, 
        last_attempt_at = now(),
        locked_until = NULL
    WHERE id = current_record.id;
    
    RETURN jsonb_build_object(
      'is_locked', false,
      'attempts_remaining', 4,
      'time_remaining_seconds', 0
    );
  END IF;
  
  -- Increment attempts
  UPDATE public.failed_login_attempts 
  SET attempts_count = attempts_count + 1,
      last_attempt_at = now()
  WHERE id = current_record.id;
  
  current_record.attempts_count := current_record.attempts_count + 1;
  
  -- Progressive lockout: 5 attempts = 5min, 8 = 15min, 10+ = 30min
  IF current_record.attempts_count >= 10 THEN
    lockout_duration := interval '30 minutes';
  ELSIF current_record.attempts_count >= 8 THEN
    lockout_duration := interval '15 minutes';
  ELSIF current_record.attempts_count >= 5 THEN
    lockout_duration := interval '5 minutes';
  END IF;
  
  -- Apply lockout if threshold reached
  IF lockout_duration IS NOT NULL THEN
    UPDATE public.failed_login_attempts 
    SET locked_until = now() + lockout_duration
    WHERE id = current_record.id;
    
    is_locked := true;
    time_remaining := extract(epoch from lockout_duration)::integer;
  END IF;
  
  RETURN jsonb_build_object(
    'is_locked', is_locked,
    'attempts_remaining', GREATEST(0, 5 - current_record.attempts_count),
    'time_remaining_seconds', time_remaining
  );
END;
$$;

-- 5. Function to clear failed attempts on successful login
CREATE OR REPLACE FUNCTION public.clear_failed_attempts(
  identifier text,
  attempt_type text DEFAULT 'email'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.failed_login_attempts 
  WHERE identifier = clear_failed_attempts.identifier 
    AND attempt_type = clear_failed_attempts.attempt_type;
END;
$$;