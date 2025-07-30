-- Fix security definer view issue - identify and fix the problematic view
-- First, let's fix the function search path issue
ALTER FUNCTION public.audit_admin_changes() SET search_path = '';

-- Update all existing functions to have proper search path
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.update_video_rating() SET search_path = '';
ALTER FUNCTION public.increment_video_views(uuid) SET search_path = '';
ALTER FUNCTION public.audit_changes() SET search_path = '';
ALTER FUNCTION public.get_public_profile(uuid) SET search_path = '';
ALTER FUNCTION public.update_saved_services_updated_at() SET search_path = '';
ALTER FUNCTION public.calculate_distance(numeric, numeric, numeric, numeric) SET search_path = '';
ALTER FUNCTION public.update_content_rating() SET search_path = '';
ALTER FUNCTION public.increment_content_plays(uuid) SET search_path = '';
ALTER FUNCTION public.calculate_monthly_revenue(text) SET search_path = '';

-- Add the admin audit trigger to the profiles table
CREATE TRIGGER admin_changes_audit
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_admin_changes();