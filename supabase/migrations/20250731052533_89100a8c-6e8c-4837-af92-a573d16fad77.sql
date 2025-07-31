-- Fix Security Definer View issue by creating a proper view without SECURITY DEFINER
-- First, drop the existing problematic view if it exists
DROP VIEW IF EXISTS public.vendors_with_local_reps;

-- Recreate the view without SECURITY DEFINER property
CREATE VIEW public.vendors_with_local_reps AS
SELECT 
  v.*,
  CASE 
    WHEN v.parent_vendor_id IS NULL THEN
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', child.id,
              'name', child.individual_name,
              'title', child.individual_title,
              'phone', child.individual_phone,
              'email', child.individual_email,
              'license_number', child.individual_license_number,
              'location', child.location
            )
          )
          FROM public.vendors child
          WHERE child.parent_vendor_id = v.id
            AND child.is_active = true
        ),
        '[]'::jsonb
      )
    ELSE '[]'::jsonb
  END as local_representatives
FROM public.vendors v
WHERE v.is_active = true;

-- Enable RLS on the view
ALTER VIEW public.vendors_with_local_reps SET (security_invoker = true);

-- Enhance RLS policies for profiles table to prevent privilege escalation
-- Drop existing policies that might be too permissive
DROP POLICY IF EXISTS "Users can update basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can update security fields" ON public.profiles;

-- Create separate, more secure policies for different types of updates
-- Policy for basic profile information (non-security fields)
CREATE POLICY "Users can update basic profile info" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND OLD.is_admin IS NOT DISTINCT FROM NEW.is_admin
    AND OLD.creator_verified IS NOT DISTINCT FROM NEW.creator_verified
    AND OLD.revenue_share_percentage IS NOT DISTINCT FROM NEW.revenue_share_percentage
    AND OLD.total_earnings IS NOT DISTINCT FROM NEW.total_earnings
    AND OLD.bank_details IS NOT DISTINCT FROM NEW.bank_details
    AND OLD.creator_joined_at IS NOT DISTINCT FROM NEW.creator_joined_at
    AND OLD.specialties IS NOT DISTINCT FROM NEW.specialties
  );

-- Policy for admin-only security field updates
CREATE POLICY "Only admins can update security fields" ON public.profiles
  FOR UPDATE
  USING (get_user_admin_status())
  WITH CHECK (get_user_admin_status());

-- Add additional security trigger to prevent privilege escalation attempts
CREATE OR REPLACE FUNCTION public.validate_profile_security_update()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for the validation function
DROP TRIGGER IF EXISTS validate_profile_security_update_trigger ON public.profiles;
CREATE TRIGGER validate_profile_security_update_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_security_update();

-- Add rate limiting for admin operations to prevent abuse
CREATE OR REPLACE FUNCTION public.check_admin_operation_rate_limit_enhanced()
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhance the admin audit function to check rate limits
CREATE OR REPLACE FUNCTION public.audit_admin_changes_enhanced()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger to use the enhanced function
DROP TRIGGER IF EXISTS audit_admin_changes ON public.profiles;
CREATE TRIGGER audit_admin_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_admin_changes_enhanced();