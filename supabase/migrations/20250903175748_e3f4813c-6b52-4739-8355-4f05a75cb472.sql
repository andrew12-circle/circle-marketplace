-- Fix admin status function with server-side allowlist and better error handling
CREATE OR REPLACE FUNCTION public.get_user_admin_status()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  user_email text;
  profile_admin_status boolean;
BEGIN
  -- Get current user ID with timeout protection
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Server-side admin allowlist for critical admin users (bypass all checks)
  BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
    IF user_email IS NOT NULL AND user_email = ANY(ARRAY['robert@circlenetwork.io', 'andrew@heisleyteam.com']) THEN
      RETURN true;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Continue to profile check if auth.users lookup fails
      NULL;
  END;
  
  -- Fast profile-based admin check (primary method)
  BEGIN
    SELECT is_admin INTO profile_admin_status
    FROM public.profiles 
    WHERE user_id = current_user_id 
    AND is_admin = true
    LIMIT 1;
    
    IF profile_admin_status = true THEN
      RETURN true;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Fail safe to false if profile check fails
      RETURN false;
  END;
  
  -- Not admin
  RETURN false;
END;
$function$;