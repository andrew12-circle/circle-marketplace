-- Step 4: Create additional admin RPC functions for better performance
CREATE OR REPLACE FUNCTION public.admin_toggle_admin_status(
  target_user uuid,
  new_status boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin access only
  IF NOT get_user_admin_status() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Update the user's admin status
  UPDATE public.profiles 
  SET is_admin = new_status, updated_at = now()
  WHERE user_id = target_user;
  
  -- Log the action
  INSERT INTO public.admin_notifications (
    type, title, message, entity_id, entity_type, priority
  ) VALUES (
    'admin_status_change',
    'Admin Status Changed',
    'Admin status ' || CASE WHEN new_status THEN 'granted to' ELSE 'removed from' END || ' user',
    target_user,
    'user',
    'high'
  );
  
  RETURN true;
END;
$$;

-- Create function for batch user operations
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Admin access only
  IF NOT get_user_admin_status() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'admin_users', (SELECT COUNT(*) FROM public.profiles WHERE is_admin = true),
    'pro_users', (SELECT COUNT(*) FROM public.profiles WHERE is_pro = true),
    'verified_users', (SELECT COUNT(*) FROM public.profiles WHERE is_verified = true),
    'total_services', (SELECT COUNT(*) FROM public.services WHERE is_active = true),
    'total_vendors', (SELECT COUNT(*) FROM public.vendors WHERE is_active = true),
    'new_users_this_week', (
      SELECT COUNT(*) FROM public.profiles 
      WHERE created_at >= now() - interval '7 days'
    ),
    'last_updated', now()
  ) INTO result;
  
  RETURN result;
END;
$$;