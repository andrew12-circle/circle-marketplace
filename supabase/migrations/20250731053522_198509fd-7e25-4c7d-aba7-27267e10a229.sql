-- Fix Function Search Path Mutable warning by setting search_path on the function
CREATE OR REPLACE FUNCTION public.validate_profile_security_update()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If user is not admin and trying to change security-sensitive fields
  IF NOT public.get_user_admin_status() THEN
    -- Check if any security-sensitive fields are being modified
    IF (OLD.is_admin IS DISTINCT FROM NEW.is_admin) OR
       (OLD.creator_verified IS DISTINCT FROM NEW.creator_verified) OR
       (OLD.revenue_share_percentage IS DISTINCT FROM NEW.revenue_share_percentage) OR
       (OLD.total_earnings IS DISTINCT FROM NEW.total_earnings) OR
       (OLD.bank_details IS DISTINCT FROM NEW.bank_details) OR
       (OLD.creator_joined_at IS DISTINCT FROM NEW.creator_joined_at) OR
       (OLD.specialties IS DISTINCT FROM NEW.specialties) THEN
      
      -- Log the security event
      INSERT INTO public.security_events (event_type, user_id, event_data)
      VALUES (
        'unauthorized_profile_modification_attempt',
        auth.uid(),
        jsonb_build_object(
          'target_user_id', NEW.user_id,
          'attempted_changes', jsonb_build_object(
            'is_admin', CASE WHEN OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN jsonb_build_object('old', OLD.is_admin, 'new', NEW.is_admin) ELSE NULL END,
            'creator_verified', CASE WHEN OLD.creator_verified IS DISTINCT FROM NEW.creator_verified THEN jsonb_build_object('old', OLD.creator_verified, 'new', NEW.creator_verified) ELSE NULL END,
            'specialties', CASE WHEN OLD.specialties IS DISTINCT FROM NEW.specialties THEN jsonb_build_object('old', OLD.specialties, 'new', NEW.specialties) ELSE NULL END
          ),
          'timestamp', now(),
          'blocked', true
        )
      );
      
      RAISE EXCEPTION 'Unauthorized modification of security-sensitive profile fields';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add rate limiting for admin operations to prevent abuse
CREATE OR REPLACE FUNCTION public.check_admin_operation_rate_limit_enhanced()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  operation_count integer;
  daily_operation_count integer;
BEGIN
  -- Count admin operations in last 5 minutes
  SELECT COUNT(*) INTO operation_count
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type IN ('admin_privilege_change', 'creator_verification_change', 'admin_specialty_added', 'unauthorized_profile_modification_attempt')
    AND created_at > now() - interval '5 minutes';
  
  -- Count admin operations in last 24 hours
  SELECT COUNT(*) INTO daily_operation_count
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type IN ('admin_privilege_change', 'creator_verification_change', 'admin_specialty_added')
    AND created_at > now() - interval '24 hours';
  
  -- Allow max 10 admin operations per 5 minutes and 100 per day
  IF operation_count >= 10 OR daily_operation_count >= 100 THEN
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'admin_rate_limit_exceeded',
      auth.uid(),
      jsonb_build_object(
        'operation_count_5min', operation_count,
        'operation_count_24h', daily_operation_count,
        'timestamp', now()
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Enhance the admin audit function to check rate limits
CREATE OR REPLACE FUNCTION public.audit_admin_changes_enhanced()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check rate limits for admin operations
  IF NOT public.check_admin_operation_rate_limit_enhanced() THEN
    RAISE EXCEPTION 'Admin operation rate limit exceeded';
  END IF;
  
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
$$;

-- Update the trigger to use the enhanced function
DROP TRIGGER IF EXISTS audit_admin_changes ON public.profiles;
CREATE TRIGGER audit_admin_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_admin_changes_enhanced();