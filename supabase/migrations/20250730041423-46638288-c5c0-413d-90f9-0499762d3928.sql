-- CRITICAL SECURITY FIX: Prevent privilege escalation in profiles table

-- First, drop the overly permissive update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create separate policies for different types of profile updates

-- 1. Allow users to update non-security fields only
CREATE POLICY "Users can update basic profile info" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent updates to security-sensitive fields
  OLD.is_admin = NEW.is_admin AND
  OLD.creator_verified = NEW.creator_verified AND
  OLD.is_creator = NEW.is_creator AND
  OLD.specialties = NEW.specialties AND
  OLD.revenue_share_percentage = NEW.revenue_share_percentage AND
  OLD.total_earnings = NEW.total_earnings AND
  OLD.bank_details = NEW.bank_details AND
  OLD.creator_joined_at = NEW.creator_joined_at
);

-- 2. Only admins can update security-sensitive fields
CREATE POLICY "Only admins can update security fields" 
ON public.profiles 
FOR UPDATE 
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

-- 3. Enhanced audit trigger for admin privilege changes
CREATE OR REPLACE FUNCTION public.audit_security_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for security changes
DROP TRIGGER IF EXISTS audit_security_changes_trigger ON public.profiles;
CREATE TRIGGER audit_security_changes_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_security_changes();

-- Add rate limiting function for admin privilege changes
CREATE OR REPLACE FUNCTION public.check_admin_change_rate_limit(target_user_id uuid)
RETURNS boolean AS $$
DECLARE
  recent_changes integer;
BEGIN
  -- Check for admin privilege changes in the last hour
  SELECT COUNT(*) INTO recent_changes
  FROM public.security_events
  WHERE event_type IN ('admin_privilege_change', 'admin_specialty_added')
  AND event_data->>'target_user_id' = target_user_id::text
  AND created_at > now() - interval '1 hour';
  
  -- Allow max 3 admin privilege changes per hour per user
  RETURN recent_changes < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add validation policy to enforce rate limiting
CREATE POLICY "Rate limit admin privilege changes" 
ON public.profiles 
FOR UPDATE 
USING (
  CASE 
    WHEN OLD.is_admin IS DISTINCT FROM NEW.is_admin OR 
         ('admin' = ANY(NEW.specialties) AND NOT 'admin' = ANY(OLD.specialties))
    THEN check_admin_change_rate_limit(NEW.user_id)
    ELSE true
  END
);