-- Drop and recreate get_admin_stats function with correct return type and existing columns only
DROP FUNCTION IF EXISTS public.get_admin_stats();

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  total_users integer;
  pro_users integer;
  admin_users integer;
  creator_users integer;
  total_services integer;
  total_vendors integer;
  new_users_last_30_days integer;
  last_updated timestamp with time zone;
BEGIN
  -- Check admin access
  IF NOT get_user_admin_status() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admin access required';
  END IF;

  -- Get user counts
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  SELECT COUNT(*) INTO pro_users FROM public.profiles WHERE is_pro = true OR is_pro_member = true;
  SELECT COUNT(*) INTO admin_users FROM public.profiles WHERE is_admin = true;
  SELECT COUNT(*) INTO creator_users FROM public.profiles WHERE is_creator = true;

  -- Get service and vendor counts
  SELECT COUNT(*) INTO total_services FROM public.services WHERE is_active = true;
  SELECT COUNT(*) INTO total_vendors FROM public.vendors WHERE is_active = true;

  -- Get new users in last 30 days
  SELECT COUNT(*) INTO new_users_last_30_days 
  FROM public.profiles 
  WHERE created_at >= now() - interval '30 days';

  -- Set last updated
  last_updated := now();

  -- Build result
  result := jsonb_build_object(
    'total_users', total_users,
    'pro_users', pro_users,
    'admin_users', admin_users,
    'creator_users', creator_users,
    'total_services', total_services,
    'total_vendors', total_vendors,
    'new_users_last_30_days', new_users_last_30_days,
    'last_updated', last_updated
  );

  RETURN result;
END;
$$;