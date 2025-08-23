-- Fix Security Definer Functions that don't need elevated privileges
-- Only keep SECURITY DEFINER for functions that truly need it (admin functions, etc.)

-- Remove SECURITY DEFINER from functions that don't need elevated privileges
ALTER FUNCTION public.get_trending_services(text, numeric, integer, integer) SECURITY INVOKER;
ALTER FUNCTION public.get_bestseller_services(text, numeric, integer, integer) SECURITY INVOKER;
ALTER FUNCTION public.warm_marketplace_cache() SECURITY INVOKER;
ALTER FUNCTION public.get_marketplace_cache(text) SECURITY INVOKER;
ALTER FUNCTION public.get_service_tracking_metrics(uuid, text) SECURITY INVOKER;
ALTER FUNCTION public.get_service_rating_stats(uuid) SECURITY INVOKER;
ALTER FUNCTION public.calculate_vendor_stats(uuid) SECURITY INVOKER;
ALTER FUNCTION public.check_agent_vendor_match(uuid, uuid) SECURITY INVOKER;
ALTER FUNCTION public.get_creator_earnings_summary(uuid) SECURITY INVOKER;
ALTER FUNCTION public.get_enhanced_creator_info(uuid) SECURITY INVOKER;
ALTER FUNCTION public.get_funnel_metrics(text) SECURITY INVOKER;

-- Keep SECURITY DEFINER only for functions that need elevated privileges like:
-- - Admin functions (validate_admin_session_context, secure_profile_update, etc.)
-- - System functions (ensure_profile_exists, auto_create_vendor_record, etc.)
-- - Trigger functions (update_*, calculate_*, validate_*, etc.)

-- The above functions are mainly read-only query functions that don't need elevated privileges