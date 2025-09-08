-- Step 3: Create keyset pagination RPCs for admin performance
CREATE OR REPLACE FUNCTION public.get_profiles_keyset(
  cursor_date timestamptz DEFAULT NULL,
  page_size integer DEFAULT 50,
  search_term text DEFAULT NULL
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  is_admin boolean,
  is_verified boolean,
  is_pro boolean,
  created_at timestamptz,
  updated_at timestamptz,
  has_next boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actual_cursor timestamptz;
BEGIN
  -- Admin access only
  IF NOT get_user_admin_status() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  actual_cursor := COALESCE(cursor_date, '9999-12-31'::timestamptz);
  
  RETURN QUERY
  WITH profile_page AS (
    SELECT 
      p.user_id,
      p.display_name,
      p.is_admin,
      p.is_verified,
      p.is_pro,
      p.created_at,
      p.updated_at
    FROM public.profiles p
    WHERE p.created_at < actual_cursor
      AND (search_term IS NULL OR p.display_name ILIKE '%' || search_term || '%')
    ORDER BY p.created_at DESC
    LIMIT page_size + 1
  )
  SELECT 
    pp.user_id,
    pp.display_name,
    pp.is_admin,
    pp.is_verified,
    pp.is_pro,
    pp.created_at,
    pp.updated_at,
    (row_number() OVER ()) <= page_size AS has_next
  FROM profile_page pp;
END;
$$;