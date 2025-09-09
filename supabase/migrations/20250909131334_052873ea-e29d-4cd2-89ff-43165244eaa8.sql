-- Clean up function overloading issue
DROP FUNCTION IF EXISTS public.get_profiles_keyset(integer, text, uuid);
DROP FUNCTION IF EXISTS public.get_profiles_keyset(integer, text, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_profiles_keyset(cursor_date timestamp with time zone, page_size integer, search_term text);
DROP FUNCTION IF EXISTS public.get_profiles_keyset(page_size integer, search_term text, cursor_date timestamp with time zone);

-- Create a single, clean function
CREATE OR REPLACE FUNCTION public.get_profiles_keyset(
  cursor_date timestamp with time zone DEFAULT NULL,
  page_size integer DEFAULT 50,
  search_term text DEFAULT ''
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  is_admin boolean,
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
    COALESCE(p.is_admin, false) as is_admin,
    COALESCE(p.is_pro, false) as is_pro,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE 
    (search_term IS NULL OR search_term = '' OR p.display_name ILIKE '%' || search_term || '%')
    AND (cursor_date IS NULL OR p.created_at > cursor_date)
  ORDER BY p.created_at ASC
  LIMIT page_size + 1; -- +1 to check if there are more rows
END;
$$;