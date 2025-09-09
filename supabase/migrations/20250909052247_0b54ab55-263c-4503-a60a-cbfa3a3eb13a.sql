-- First, let's check what columns actually exist in the profiles table
-- and fix the function accordingly

-- Drop and recreate the function with correct columns
DROP FUNCTION IF EXISTS public.get_profiles_keyset(integer, text, uuid);

-- Create the function with only existing columns
CREATE OR REPLACE FUNCTION public.get_profiles_keyset(
  page_size integer DEFAULT 50,
  search_term text DEFAULT '',
  cursor_user_id uuid DEFAULT NULL
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
    (search_term = '' OR p.display_name ILIKE '%' || search_term || '%' OR p.user_id::text ILIKE '%' || search_term || '%')
    AND (cursor_user_id IS NULL OR p.user_id > cursor_user_id)
  ORDER BY p.user_id ASC
  LIMIT page_size;
END;
$$;