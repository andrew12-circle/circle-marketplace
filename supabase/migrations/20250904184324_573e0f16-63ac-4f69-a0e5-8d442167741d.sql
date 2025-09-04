-- Update get_user_admin_status to be the single source of truth for admin access
-- This function will check both profile.is_admin and a hardcoded email allowlist
CREATE OR REPLACE FUNCTION public.get_user_admin_status()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  user_email text;
BEGIN
  -- Get current user's email from auth
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Check hardcoded admin allowlist first (immediate access for critical users)
  IF user_email IS NOT NULL AND user_email = ANY(
    ARRAY[
      'robert@circlenetwork.io',
      'andrew@circlenetwork.io',  -- Added missing admin email
      'andrew@heisleyteam.com'
    ]
  ) THEN
    RETURN true;
  END IF;
  
  -- Check profile.is_admin as secondary method
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$function$;