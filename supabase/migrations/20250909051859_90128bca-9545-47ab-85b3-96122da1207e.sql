-- Create function to get profiles with keyset pagination
CREATE OR REPLACE FUNCTION public.get_profiles_keyset(
  page_size integer DEFAULT 50,
  search_term text DEFAULT '',
  cursor_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  is_admin boolean,
  is_verified boolean,
  is_pro boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check admin access
  IF NOT get_user_admin_status() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    p.is_admin,
    p.is_verified,
    p.is_pro,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE 
    (search_term = '' OR p.display_name ILIKE '%' || search_term || '%')
    AND (cursor_user_id IS NULL OR p.user_id > cursor_user_id)
  ORDER BY p.user_id ASC
  LIMIT page_size;
END;
$$;

-- Create function to toggle admin status
CREATE OR REPLACE FUNCTION public.admin_toggle_admin_status(
  target_user uuid,
  new_status boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check admin access
  IF NOT get_user_admin_status() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Prevent self-demotion
  IF target_user = auth.uid() AND new_status = false THEN
    RAISE EXCEPTION 'Cannot remove admin privileges from yourself';
  END IF;

  -- Update the user's admin status
  UPDATE public.profiles 
  SET 
    is_admin = new_status,
    updated_at = now()
  WHERE user_id = target_user;

  -- Update specialties array if needed
  IF new_status = true THEN
    UPDATE public.profiles 
    SET specialties = CASE 
      WHEN 'admin' = ANY(specialties) THEN specialties
      ELSE array_append(specialties, 'admin')
    END
    WHERE user_id = target_user;
  ELSE
    UPDATE public.profiles 
    SET specialties = array_remove(specialties, 'admin')
    WHERE user_id = target_user;
  END IF;

  -- Log the action
  INSERT INTO public.security_events (event_type, user_id, event_data)
  VALUES (
    'admin_status_changed',
    auth.uid(),
    jsonb_build_object(
      'target_user', target_user,
      'new_status', new_status,
      'changed_by', auth.uid()
    )
  );
END;
$$;

-- Create function to set pro status
CREATE OR REPLACE FUNCTION public.admin_set_pro_status(
  target_user uuid,
  pro boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check admin access
  IF NOT get_user_admin_status() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update the user's pro status
  UPDATE public.profiles 
  SET 
    is_pro = pro,
    updated_at = now()
  WHERE user_id = target_user;

  -- Log the action
  INSERT INTO public.security_events (event_type, user_id, event_data)
  VALUES (
    'pro_status_changed',
    auth.uid(),
    jsonb_build_object(
      'target_user', target_user,
      'new_status', pro,
      'changed_by', auth.uid()
    )
  );
END;
$$;