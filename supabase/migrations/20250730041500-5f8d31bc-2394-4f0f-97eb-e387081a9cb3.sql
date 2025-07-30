-- CRITICAL SECURITY FIX: Prevent privilege escalation in profiles table

-- First, drop the overly permissive update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create separate policies for different types of profile updates

-- 1. Allow users to update non-security fields only
CREATE POLICY "Users can update basic profile info" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

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

-- Add validation function to prevent security field updates by non-admins
CREATE OR REPLACE FUNCTION public.validate_profile_security_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is not admin and trying to change security-sensitive fields
  IF NOT get_user_admin_status() AND (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to validate security field updates
DROP TRIGGER IF EXISTS validate_profile_security_trigger ON public.profiles;
CREATE TRIGGER validate_profile_security_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_security_fields();