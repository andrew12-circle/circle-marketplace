-- Fix database security issues identified by linter

-- 1. Update functions to have proper search path security
-- These functions need SET search_path = '' for security

CREATE OR REPLACE FUNCTION public.audit_security_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Log when admin status changes
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'admin_privilege_change',
      auth.uid(),
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'old_is_admin', OLD.is_admin,
        'new_is_admin', NEW.is_admin,
        'changed_by', auth.uid(),
        'timestamp', now()
      )
    );
  END IF;
  
  -- Log when creator verification changes
  IF OLD.creator_verified IS DISTINCT FROM NEW.creator_verified THEN
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'creator_verification_change',
      auth.uid(),
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'old_creator_verified', OLD.creator_verified,
        'new_creator_verified', NEW.creator_verified,
        'changed_by', auth.uid(),
        'timestamp', now()
      )
    );
  END IF;
  
  -- Log when specialties change to include admin
  IF (OLD.specialties IS DISTINCT FROM NEW.specialties) AND 
     ('admin' = ANY(NEW.specialties) OR NEW.specialties @> ARRAY['admin'::text]) THEN
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'admin_specialty_added',
      auth.uid(),
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'old_specialties', OLD.specialties,
        'new_specialties', NEW.specialties,
        'changed_by', auth.uid(),
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_profile_security_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- If user is not admin and trying to change security-sensitive fields
  IF NOT public.get_user_admin_status() AND (
    OLD.is_admin IS DISTINCT FROM NEW.is_admin OR
    OLD.creator_verified IS DISTINCT FROM NEW.creator_verified OR
    OLD.specialties IS DISTINCT FROM NEW.specialties OR
    OLD.revenue_share_percentage IS DISTINCT FROM NEW.revenue_share_percentage OR
    OLD.total_earnings IS DISTINCT FROM NEW.total_earnings OR
    OLD.bank_details IS DISTINCT FROM NEW.bank_details OR
    OLD.creator_joined_at IS DISTINCT FROM NEW.creator_joined_at
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can modify security-sensitive fields';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Add enhanced privilege escalation protection
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Prevent users from making themselves admin unless they're already admin
  IF OLD.is_admin = false AND NEW.is_admin = true AND NOT public.get_user_admin_status() THEN
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'privilege_escalation_attempt',
      auth.uid(),
      jsonb_build_object(
        'attempted_by', auth.uid(),
        'target_user', NEW.user_id,
        'timestamp', now(),
        'blocked', true
      )
    );
    RAISE EXCEPTION 'Unauthorized privilege escalation attempt blocked';
  END IF;
  
  -- Prevent users from adding admin specialty unless they're already admin
  IF NOT (OLD.specialties @> ARRAY['admin'::text]) AND 
     (NEW.specialties @> ARRAY['admin'::text]) AND 
     NOT public.get_user_admin_status() THEN
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'admin_specialty_escalation_attempt',
      auth.uid(),
      jsonb_build_object(
        'attempted_by', auth.uid(),
        'target_user', NEW.user_id,
        'timestamp', now(),
        'blocked', true
      )
    );
    RAISE EXCEPTION 'Unauthorized admin specialty addition blocked';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Create trigger for privilege escalation protection
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_privilege_escalation();

-- 4. Create enhanced security monitoring trigger
DROP TRIGGER IF EXISTS audit_security_changes_trigger ON public.profiles;
CREATE TRIGGER audit_security_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_security_changes();

-- 5. Add rate limiting function for sensitive operations
CREATE OR REPLACE FUNCTION public.check_admin_operation_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  operation_count integer;
BEGIN
  -- Count admin operations in last 5 minutes
  SELECT COUNT(*) INTO operation_count
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type IN ('admin_privilege_change', 'creator_verification_change', 'admin_specialty_added')
    AND created_at > now() - interval '5 minutes';
  
  -- Allow max 10 admin operations per 5 minutes
  IF operation_count >= 10 THEN
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'admin_rate_limit_exceeded',
      auth.uid(),
      jsonb_build_object(
        'operation_count', operation_count,
        'time_window', '5 minutes',
        'timestamp', now()
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

-- 6. Add function to cleanup old security events (for performance)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Keep only last 90 days of security events
  DELETE FROM public.security_events 
  WHERE created_at < now() - interval '90 days';
END;
$function$;