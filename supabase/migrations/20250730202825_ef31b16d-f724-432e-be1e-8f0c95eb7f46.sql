-- Fix remaining security definer issues and implement critical security enhancements

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

-- 2. Enhance password strength validation
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

-- 6. Create admin session management table
CREATE TABLE IF NOT EXISTS public.admin_sessions_enhanced (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '30 minutes'),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.admin_sessions_enhanced ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view their own admin sessions"
ON public.admin_sessions_enhanced
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can create/update sessions
CREATE POLICY "Admins can manage admin sessions"
ON public.admin_sessions_enhanced
FOR ALL
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

-- 7. Enhanced admin session validation
CREATE OR REPLACE FUNCTION public.validate_admin_session_enhanced(
  session_token text,
  extend_session boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  session_record record;
  is_valid boolean := false;
BEGIN
  -- Get session record
  SELECT * INTO session_record
  FROM public.admin_sessions_enhanced
  WHERE session_token = validate_admin_session_enhanced.session_token
    AND user_id = auth.uid()
    AND is_active = true
    AND expires_at > now();
  
  IF session_record IS NOT NULL THEN
    is_valid := true;
    
    -- Extend session if requested
    IF extend_session THEN
      UPDATE public.admin_sessions_enhanced
      SET last_activity = now(),
          expires_at = now() + interval '30 minutes'
      WHERE id = session_record.id;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'is_valid', is_valid,
    'expires_at', session_record.expires_at,
    'last_activity', session_record.last_activity
  );
END;
$$;

-- 8. Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Mark expired sessions as inactive
  UPDATE public.admin_sessions_enhanced
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up old inactive sessions (older than 24 hours)
  DELETE FROM public.admin_sessions_enhanced
  WHERE is_active = false 
    AND last_activity < now() - interval '24 hours';
  
  RETURN deleted_count;
END;
$$;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_identifier 
ON public.failed_login_attempts(identifier, attempt_type);

CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_locked_until 
ON public.failed_login_attempts(locked_until) WHERE locked_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_enhanced_token 
ON public.admin_sessions_enhanced(session_token) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_enhanced_expires 
ON public.admin_sessions_enhanced(expires_at) WHERE is_active = true;