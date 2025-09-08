-- Fix search path for get_current_uid function
CREATE OR REPLACE FUNCTION public.get_current_uid()
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (nullif(current_setting('request.jwt.claim.sub', true), ''))::uuid
$$;