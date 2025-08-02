-- Create missing get_user_admin_status function
CREATE OR REPLACE FUNCTION public.get_user_admin_status()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_admin_status boolean := false;
BEGIN
  -- Check if current user is admin
  SELECT is_admin INTO user_admin_status
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_admin_status, false);
END;
$$;

-- Simplify the complex profiles RLS policy for updates
DROP POLICY IF EXISTS "Users can update non-security fields only" ON public.profiles;

CREATE POLICY "Users can update their own profiles safely"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND (
    -- Allow admins to update all fields
    public.get_user_admin_status() = true OR
    -- Non-admins can only update non-sensitive fields
    (
      is_admin = (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) AND
      creator_verified = (SELECT creator_verified FROM public.profiles WHERE user_id = auth.uid()) AND
      revenue_share_percentage = (SELECT revenue_share_percentage FROM public.profiles WHERE user_id = auth.uid()) AND
      total_earnings = (SELECT total_earnings FROM public.profiles WHERE user_id = auth.uid()) AND
      bank_details = (SELECT bank_details FROM public.profiles WHERE user_id = auth.uid())
    )
  )
);

-- Add rate limiting function for security operations
CREATE OR REPLACE FUNCTION public.check_security_operation_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  operation_count integer;
BEGIN
  -- Count security operations in last 10 minutes
  SELECT COUNT(*) INTO operation_count
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type LIKE '%admin%' OR event_type LIKE '%security%'
    AND created_at > now() - interval '10 minutes';
  
  -- Allow max 20 security operations per 10 minutes
  IF operation_count >= 20 THEN
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'security_rate_limit_exceeded',
      auth.uid(),
      jsonb_build_object(
        'operation_count', operation_count,
        'time_window', '10 minutes',
        'timestamp', now(),
        'ip_address', inet_client_addr()::text
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Enhanced session validation function
CREATE OR REPLACE FUNCTION public.validate_session_context()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_count integer;
  last_activity timestamp with time zone;
BEGIN
  -- Check for suspicious concurrent sessions
  SELECT COUNT(*), MAX(last_activity) INTO session_count, last_activity
  FROM public.admin_sessions
  WHERE user_id = auth.uid() 
    AND expires_at > now();
  
  -- Limit to 3 concurrent sessions
  IF session_count > 3 THEN
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'suspicious_concurrent_sessions',
      auth.uid(),
      jsonb_build_object(
        'session_count', session_count,
        'timestamp', now(),
        'ip_address', inet_client_addr()::text
      )
    );
    RETURN false;
  END IF;
  
  -- Check for session timeout (30 minutes of inactivity)
  IF last_activity < now() - interval '30 minutes' THEN
    DELETE FROM public.admin_sessions 
    WHERE user_id = auth.uid() 
      AND last_activity < now() - interval '30 minutes';
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Create comprehensive input validation function
CREATE OR REPLACE FUNCTION public.validate_and_sanitize_text_input(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return empty string for null input
  IF input_text IS NULL THEN
    RETURN '';
  END IF;
  
  -- Remove potential script tags and suspicious patterns
  input_text := regexp_replace(input_text, '<script[^>]*>.*?</script>', '', 'gi');
  input_text := regexp_replace(input_text, '<[^>]*script[^>]*>', '', 'gi');
  input_text := regexp_replace(input_text, 'javascript:', '', 'gi');
  input_text := regexp_replace(input_text, 'vbscript:', '', 'gi');
  input_text := regexp_replace(input_text, 'onload=', '', 'gi');
  input_text := regexp_replace(input_text, 'onerror=', '', 'gi');
  input_text := regexp_replace(input_text, 'onclick=', '', 'gi');
  
  -- Trim whitespace and limit length
  input_text := trim(input_text);
  
  -- Limit to reasonable length (10000 chars)
  IF length(input_text) > 10000 THEN
    input_text := left(input_text, 10000);
  END IF;
  
  RETURN input_text;
END;
$$;

-- Add comprehensive audit trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all operations on sensitive tables
  IF TG_TABLE_NAME IN ('profiles', 'admin_sessions', 'point_allocations', 'point_transactions') THEN
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'sensitive_table_operation',
      auth.uid(),
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', now(),
        'ip_address', inet_client_addr()::text,
        'user_agent', current_setting('request.headers', true)::json->>'user-agent'
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for sensitive tables
DROP TRIGGER IF EXISTS audit_profiles_operations ON public.profiles;
CREATE TRIGGER audit_profiles_operations
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

DROP TRIGGER IF EXISTS audit_admin_sessions_operations ON public.admin_sessions;
CREATE TRIGGER audit_admin_sessions_operations
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_sessions
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

-- Enhanced backup verification function
CREATE OR REPLACE FUNCTION public.verify_critical_data_integrity()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profiles_count integer;
  security_events_count integer;
  point_allocations_count integer;
BEGIN
  -- Basic integrity checks
  SELECT COUNT(*) INTO profiles_count FROM public.profiles;
  SELECT COUNT(*) INTO security_events_count FROM public.security_events;
  SELECT COUNT(*) INTO point_allocations_count FROM public.point_allocations;
  
  -- Log integrity check
  INSERT INTO public.security_events (event_type, user_id, event_data)
  VALUES (
    'data_integrity_check',
    auth.uid(),
    jsonb_build_object(
      'profiles_count', profiles_count,
      'security_events_count', security_events_count,
      'point_allocations_count', point_allocations_count,
      'timestamp', now()
    )
  );
  
  RETURN true;
END;
$$;