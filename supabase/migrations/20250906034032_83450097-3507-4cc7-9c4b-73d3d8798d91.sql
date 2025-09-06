-- Fix security warnings by setting search_path on functions
ALTER FUNCTION public.update_concierge_session_updated_at() SET search_path = public;