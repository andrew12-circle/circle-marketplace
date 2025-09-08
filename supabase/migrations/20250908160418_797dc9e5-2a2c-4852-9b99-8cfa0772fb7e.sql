-- Step 1: Create stable auth helper function
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid,
    (SELECT auth.uid())
  );
$$;