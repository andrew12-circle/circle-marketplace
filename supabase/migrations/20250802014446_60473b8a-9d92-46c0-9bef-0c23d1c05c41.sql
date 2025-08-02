-- Critical Security Enhancement: Database-level privilege escalation prevention

-- 1. Create enhanced security audit functions
CREATE OR REPLACE FUNCTION public.validate_admin_privilege_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_is_admin BOOLEAN;
  target_user_record RECORD;
BEGIN
  -- Get current user's admin status
  SELECT is_admin INTO current_user_is_admin
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Get target user record
  SELECT * INTO target_user_record
  FROM public.profiles
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Only allow admin privilege changes if current user is admin
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    IF NOT COALESCE(current_user_is_admin, false) THEN
      -- Log unauthorized attempt
      INSERT INTO public.security_events (event_type, user_id, event_data)
      VALUES (
        'unauthorized_admin_privilege_attempt',
        auth.uid(),
        jsonb_build_object(
          'target_user_id', NEW.user_id,
          'attempted_change', 'admin_privilege',
          'blocked', true,
          'timestamp', now()
        )
      );
      
      RAISE EXCEPTION 'SECURITY_VIOLATION: Unauthorized attempt to modify admin privileges';
    END IF;
    
    -- Additional check: Prevent self-demotion if this is the last admin
    IF OLD.is_admin = true AND NEW.is_admin = false AND NEW.user_id = auth.uid() THEN
      IF (SELECT COUNT(*) FROM public.profiles WHERE is_admin = true AND user_id != auth.uid()) = 0 THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Cannot remove admin privileges from last admin user';
      END IF;
    END IF;
    
    -- Log legitimate admin privilege change
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'admin_privilege_change_authorized',
      auth.uid(),
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'old_admin_status', OLD.is_admin,
        'new_admin_status', NEW.is_admin,
        'changed_by', auth.uid(),
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Create enhanced rate limiting for admin operations
CREATE OR REPLACE FUNCTION public.check_admin_operation_rate_limit_strict()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  operation_count_5min integer;
  operation_count_1hour integer;
  operation_count_24h integer;
BEGIN
  -- Count admin operations in different time windows
  SELECT COUNT(*) INTO operation_count_5min
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type LIKE '%admin%'
    AND created_at > now() - interval '5 minutes';
    
  SELECT COUNT(*) INTO operation_count_1hour
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type LIKE '%admin%'
    AND created_at > now() - interval '1 hour';
    
  SELECT COUNT(*) INTO operation_count_24h
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type LIKE '%admin%'
    AND created_at > now() - interval '24 hours';
  
  -- Strict rate limits: 5 per 5min, 20 per hour, 100 per day
  IF operation_count_5min >= 5 OR operation_count_1hour >= 20 OR operation_count_24h >= 100 THEN
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'admin_rate_limit_exceeded_strict',
      auth.uid(),
      jsonb_build_object(
        'counts', jsonb_build_object(
          '5min', operation_count_5min,
          '1hour', operation_count_1hour,
          '24h', operation_count_24h
        ),
        'timestamp', now()
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 3. Create secure admin session validation
CREATE OR REPLACE FUNCTION public.validate_admin_session_context()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  is_valid_admin BOOLEAN := false;
  session_count INTEGER;
BEGIN
  -- Check if user is actually admin
  SELECT is_admin INTO is_valid_admin
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF NOT COALESCE(is_valid_admin, false) THEN
    -- Log unauthorized admin attempt
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'unauthorized_admin_access_attempt',
      auth.uid(),
      jsonb_build_object(
        'ip_address', inet_client_addr()::text,
        'timestamp', now()
      )
    );
    RETURN false;
  END IF;
  
  -- Check for suspicious concurrent sessions
  SELECT COUNT(*) INTO session_count
  FROM public.admin_sessions
  WHERE user_id = auth.uid() 
    AND expires_at > now();
    
  IF session_count > 3 THEN
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'suspicious_admin_session_activity',
      auth.uid(),
      jsonb_build_object(
        'concurrent_sessions', session_count,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN true;
END;
$$;

-- 4. Create trigger for enhanced profile security validation
DROP TRIGGER IF EXISTS enhanced_admin_security_trigger ON public.profiles;
CREATE TRIGGER enhanced_admin_security_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admin_privilege_change();

-- 5. Enhanced RLS policies for admin_sessions table
DROP POLICY IF EXISTS "Enhanced admin session security" ON public.admin_sessions;
CREATE POLICY "Enhanced admin session security" ON public.admin_sessions
  FOR ALL 
  USING (
    auth.uid() = user_id AND 
    public.validate_admin_session_context() AND
    public.check_admin_operation_rate_limit_strict()
  )
  WITH CHECK (
    auth.uid() = user_id AND 
    public.validate_admin_session_context()
  );

-- 6. Create function to validate secure admin operations
CREATE OR REPLACE FUNCTION public.validate_secure_admin_operation(operation_type text, target_data jsonb DEFAULT '{}'::jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  is_admin BOOLEAN;
  rate_limit_ok BOOLEAN;
BEGIN
  -- Validate admin status
  SELECT public.get_user_admin_status() INTO is_admin;
  IF NOT is_admin THEN
    RETURN false;
  END IF;
  
  -- Check rate limits
  SELECT public.check_admin_operation_rate_limit_strict() INTO rate_limit_ok;
  IF NOT rate_limit_ok THEN
    RETURN false;
  END IF;
  
  -- Log the operation
  INSERT INTO public.security_events (event_type, user_id, event_data)
  VALUES (
    'secure_admin_operation_' || operation_type,
    auth.uid(),
    jsonb_build_object(
      'operation_type', operation_type,
      'target_data', target_data,
      'timestamp', now(),
      'ip_address', inet_client_addr()::text
    )
  );
  
  RETURN true;
END;
$$;