-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION get_user_admin_status()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE user_id = auth.uid()),
    false
  );
$$;