-- Create a debug version of get_profiles_keyset that doesn't require admin check temporarily
-- for troubleshooting
CREATE OR REPLACE FUNCTION public.debug_get_profiles_keyset(
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
  updated_at timestamp with time zone,
  auth_uid text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Debug version - return auth.uid() to see what's happening
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    COALESCE(p.is_admin, false) as is_admin,
    COALESCE(p.is_pro, false) as is_pro,
    p.created_at,
    p.updated_at,
    COALESCE(auth.uid()::text, 'NULL') as auth_uid
  FROM public.profiles p
  WHERE 
    (search_term IS NULL OR search_term = '' OR p.display_name ILIKE '%' || search_term || '%')
    AND (cursor_date IS NULL OR p.created_at > cursor_date)
  ORDER BY p.created_at ASC
  LIMIT page_size + 1; -- +1 to check if there are more rows
END;
$$;