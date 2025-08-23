-- Fix search path security issues for the new functions
ALTER FUNCTION public.identify_security_definer_views() SET search_path TO 'public';
ALTER FUNCTION public.audit_security_definer_functions() SET search_path TO 'public';