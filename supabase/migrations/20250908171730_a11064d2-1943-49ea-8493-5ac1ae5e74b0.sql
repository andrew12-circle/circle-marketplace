-- Create get_current_uid function in public schema (can't modify auth schema)
CREATE OR REPLACE FUNCTION public.get_current_uid()
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
AS $$
  SELECT (nullif(current_setting('request.jwt.claim.sub', true), ''))::uuid
$$;