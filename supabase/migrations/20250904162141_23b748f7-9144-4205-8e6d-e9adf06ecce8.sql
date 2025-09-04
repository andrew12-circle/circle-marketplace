-- Fix get_user_admin_status function to include email allowlist for immediate admin access
CREATE OR REPLACE FUNCTION public.get_user_admin_status()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  user_profile RECORD;
BEGIN
  -- First check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user email from auth.users
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Admin allowlist check - immediate admin access for critical users
  IF user_email IS NOT NULL AND LOWER(user_email) IN ('robert@circlenetwork.io', 'andrew@heisleyteam.com', 'andrew@circlenetwork.io') THEN
    RETURN TRUE;
  END IF;
  
  -- Check profile is_admin flag
  SELECT is_admin INTO user_profile
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Return profile admin status (default to false if no profile found)
  RETURN COALESCE(user_profile.is_admin, FALSE);
  
EXCEPTION
  WHEN OTHERS THEN
    -- On any error, return false for security
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;