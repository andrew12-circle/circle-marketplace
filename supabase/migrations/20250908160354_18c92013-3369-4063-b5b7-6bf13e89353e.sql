-- Step 1: Create stable auth helper function
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid,
    (SELECT auth.uid())
  );
$$;

-- Step 2: Add critical indexes for RLS policy performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_id ON public.vendors(id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_vendor_id ON public.services(vendor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_created_at ON public.services(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_tracking_events_service_id ON public.service_tracking_events(service_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_tracking_events_created_at ON public.service_tracking_events(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_co_pay_requests_agent_id ON public.co_pay_requests(agent_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_co_pay_requests_vendor_id ON public.co_pay_requests(vendor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at);

-- Step 3: Create keyset pagination RPC for profiles
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

-- Step 4: Create keyset pagination RPC for services
CREATE OR REPLACE FUNCTION public.get_services_keyset(
  cursor_date timestamptz DEFAULT NULL,
  page_size integer DEFAULT 50,
  search_term text DEFAULT NULL,
  category_filter text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  title text,
  category text,
  list_price numeric,
  pro_price numeric,
  vendor_id uuid,
  vendor_name text,
  is_active boolean,
  created_at timestamptz,
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
  WITH service_page AS (
    SELECT 
      s.id,
      s.title,
      s.category,
      s.list_price,
      s.pro_price,
      s.vendor_id,
      v.name as vendor_name,
      s.is_active,
      s.created_at
    FROM public.services s
    LEFT JOIN public.vendors v ON s.vendor_id = v.id
    WHERE s.created_at < actual_cursor
      AND (search_term IS NULL OR s.title ILIKE '%' || search_term || '%')
      AND (category_filter IS NULL OR s.category = category_filter)
    ORDER BY s.created_at DESC
    LIMIT page_size + 1
  )
  SELECT 
    sp.id,
    sp.title,
    sp.category,
    sp.list_price,
    sp.pro_price,
    sp.vendor_id,
    sp.vendor_name,
    sp.is_active,
    sp.created_at,
    (row_number() OVER ()) <= page_size AS has_next
  FROM service_page sp;
END;
$$;