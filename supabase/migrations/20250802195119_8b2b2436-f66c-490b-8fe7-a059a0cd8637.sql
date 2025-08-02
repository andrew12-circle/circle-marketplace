-- Fix the ambiguous column reference in validate_admin_session_context function
CREATE OR REPLACE FUNCTION public.validate_admin_session_context()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;