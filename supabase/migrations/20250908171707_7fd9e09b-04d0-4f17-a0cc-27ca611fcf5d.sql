-- Create auth.get_current_uid function if it doesn't exist
CREATE OR REPLACE FUNCTION auth.get_current_uid()
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
AS $$
  SELECT (nullif(current_setting('request.jwt.claim.sub', true), ''))::uuid
$$;

-- Example policies using the stable function
-- Only create if they don't exist

DO $$ 
BEGIN
  -- Check if profiles read policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'profiles_read_own_stable'
  ) THEN
    CREATE POLICY "profiles_read_own_stable"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.get_current_uid());
  END IF;
  
  -- Note: We don't create a memberships table policy as it doesn't exist yet
  -- This is just an example of how to structure it when needed
END $$;