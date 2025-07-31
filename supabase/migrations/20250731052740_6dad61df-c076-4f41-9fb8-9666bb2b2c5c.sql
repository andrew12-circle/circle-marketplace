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
-- Policy for basic profile information (non-security fields only)
CREATE POLICY "Users can update basic profile info" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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