-- Fix critical privilege escalation in profiles table RLS policies

-- Drop the existing broad policy that could allow privilege escalation
DROP POLICY IF EXISTS "Users can update basic profile info" ON public.profiles;

-- Create a more restrictive policy that excludes security-sensitive fields
CREATE POLICY "Users can update safe profile fields" ON public.profiles
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent modification of security-sensitive fields by non-admins
  (
    get_user_admin_status() OR
    (
      -- Only allow updates to safe fields for non-admins
      OLD.is_admin = NEW.is_admin AND
      OLD.creator_verified = NEW.creator_verified AND
      OLD.specialties = NEW.specialties AND
      OLD.revenue_share_percentage = NEW.revenue_share_percentage AND
      OLD.total_earnings = NEW.total_earnings AND
      OLD.bank_details = NEW.bank_details AND
      OLD.creator_joined_at = NEW.creator_joined_at
    )
  )
);

-- Create a separate policy for admin-only security field updates
CREATE POLICY "Admins can update security fields" ON public.profiles
FOR UPDATE
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

-- Ensure the privilege escalation prevention trigger is active
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_privilege_escalation();

-- Ensure security validation trigger is active  
DROP TRIGGER IF EXISTS validate_profile_security_trigger ON public.profiles;
CREATE TRIGGER validate_profile_security_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_security_update();