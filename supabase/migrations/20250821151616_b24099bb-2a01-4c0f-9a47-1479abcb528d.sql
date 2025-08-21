-- Create function to auto-create missing profile records
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
  user_metadata jsonb;
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id) THEN
    RETURN true;
  END IF;

  -- Get user info from auth.users
  SELECT email, raw_user_meta_data INTO user_email, user_metadata
  FROM auth.users 
  WHERE id = p_user_id;
  
  -- If user doesn't exist in auth, return false
  IF user_email IS NULL THEN
    RETURN false;
  END IF;

  -- Create the profile record
  INSERT INTO public.profiles (
    user_id,
    display_name,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    COALESCE(user_metadata->>'name', user_metadata->>'display_name', split_part(user_email, '@', 1)),
    now(),
    now()
  );

  RETURN true;
END;
$function$;

-- Update secure_profile_update to auto-create profiles
CREATE OR REPLACE FUNCTION public.secure_profile_update(target_user_id uuid, update_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin BOOLEAN;
  rate_limit_ok BOOLEAN;
  profile_exists BOOLEAN;
BEGIN
  -- Validate admin status
  SELECT public.get_user_admin_status() INTO is_admin;
  IF NOT is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Access denied: Admin privileges required',
      'error', 'access_denied'
    );
  END IF;
  
  -- Check rate limits
  SELECT public.check_admin_operation_rate_limit_strict() INTO rate_limit_ok;
  IF NOT rate_limit_ok THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Too many admin operations. Please wait and try again.',
      'error', 'rate_limited'
    );
  END IF;
  
  -- Ensure profile exists (auto-create if missing)
  SELECT public.ensure_profile_exists(target_user_id) INTO profile_exists;
  IF NOT profile_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found in authentication system',
      'error', 'user_not_found'
    );
  END IF;

  -- Perform the update
  UPDATE public.profiles 
  SET 
    is_admin = COALESCE((update_data->>'is_admin')::boolean, is_admin),
    is_creator = COALESCE((update_data->>'is_creator')::boolean, is_creator),
    creator_verified = COALESCE((update_data->>'creator_verified')::boolean, creator_verified),
    creator_joined_at = CASE 
      WHEN update_data ? 'creator_joined_at' THEN 
        CASE 
          WHEN update_data->>'creator_joined_at' = 'null' THEN NULL
          ELSE (update_data->>'creator_joined_at')::timestamp with time zone
        END
      ELSE creator_joined_at
    END,
    is_pro = COALESCE((update_data->>'is_pro')::boolean, is_pro),
    updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the operation
  INSERT INTO public.security_events (event_type, user_id, event_data)
  VALUES (
    'secure_admin_operation_profile_updated',
    auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'update_data', update_data,
      'timestamp', now(),
      'ip_address', inet_client_addr()::text
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Profile updated successfully'
  );
END;
$function$;