-- Performance optimization: Add strategic indexes for frequently queried tables

-- Index for service tracking events (uses created_at)
CREATE INDEX IF NOT EXISTS idx_service_tracking_events_service_created 
ON public.service_tracking_events (service_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_tracking_events_event_type_created 
ON public.service_tracking_events (event_type, created_at DESC);

-- Index for marketplace cache lookups
CREATE INDEX IF NOT EXISTS idx_marketplace_cache_key_expires 
ON public.marketplace_cache (cache_key, expires_at DESC);

-- Index for service views (uses viewed_at)
CREATE INDEX IF NOT EXISTS idx_service_views_service_viewed 
ON public.service_views (service_id, viewed_at DESC);

-- Index for vendors active lookup with sort order
CREATE INDEX IF NOT EXISTS idx_vendors_active_approved_sort 
ON public.vendors (is_active, approval_status, sort_order, auto_score DESC) 
WHERE is_active = true AND approval_status = 'approved';

-- Index for services active lookup with sort order
CREATE INDEX IF NOT EXISTS idx_services_active_sort 
ON public.services (is_active, sort_order, created_at DESC) 
WHERE is_active = true;

-- Index for agent performance tracking monthly aggregation
CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_month 
ON public.agent_performance_tracking (agent_id, month_year);

-- Index for co-pay requests status filtering
CREATE INDEX IF NOT EXISTS idx_co_pay_requests_status_created 
ON public.co_pay_requests (status, compliance_status, created_at DESC);

-- Optimize get_trending_services function with correct column names
CREATE OR REPLACE FUNCTION public.get_trending_services(
  p_period text DEFAULT '7d',
  p_top_pct numeric DEFAULT 0.15,
  p_min_count integer DEFAULT 8,
  p_max_count integer DEFAULT 40
)
RETURNS TABLE(
  service_id uuid,
  score numeric,
  rank bigint,
  views_now bigint,
  views_prev bigint,
  conv_now numeric,
  conv_prev numeric,
  bookings_now bigint,
  purchases_now bigint,
  revenue_now numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  days_back integer;
BEGIN
  -- Parse period efficiently
  CASE p_period
    WHEN '7d' THEN days_back := 7;
    WHEN '30d' THEN days_back := 30;
    WHEN '90d' THEN days_back := 90;
    ELSE days_back := 7;
  END CASE;

  -- Use optimized query with proper indexes
  RETURN QUERY
  WITH current_period AS (
    SELECT 
      ste.service_id,
      COUNT(CASE WHEN ste.event_type = 'view' THEN 1 END) as views,
      COUNT(CASE WHEN ste.event_type = 'booking' THEN 1 END) as bookings,
      COUNT(CASE WHEN ste.event_type = 'purchase' THEN 1 END) as purchases,
      COALESCE(SUM(CASE WHEN ste.event_type = 'purchase' THEN ste.revenue_attributed END), 0) as revenue
    FROM public.service_tracking_events ste
    WHERE ste.created_at >= (CURRENT_DATE - (days_back || ' days')::interval)
    GROUP BY ste.service_id
    HAVING COUNT(CASE WHEN ste.event_type = 'view' THEN 1 END) >= p_min_count
  ),
  previous_period AS (
    SELECT 
      ste.service_id,
      COUNT(CASE WHEN ste.event_type = 'view' THEN 1 END) as views
    FROM public.service_tracking_events ste
    WHERE ste.created_at >= (CURRENT_DATE - (days_back * 2 || ' days')::interval)
      AND ste.created_at < (CURRENT_DATE - (days_back || ' days')::interval)
    GROUP BY ste.service_id
  ),
  scored_services AS (
    SELECT 
      cp.service_id,
      cp.views as views_now,
      COALESCE(pp.views, 0) as views_prev,
      cp.bookings as bookings_now,
      cp.purchases as purchases_now,
      cp.revenue as revenue_now,
      CASE WHEN cp.views > 0 THEN cp.bookings::numeric / cp.views ELSE 0 END as conv_now,
      CASE WHEN pp.views > 0 THEN 0 ELSE 0 END as conv_prev,
      -- Trending score: views + bookings + revenue impact
      (cp.views * 0.4 + cp.bookings * 0.3 + cp.revenue * 0.3) as score
    FROM current_period cp
    LEFT JOIN previous_period pp ON cp.service_id = pp.service_id
  )
  SELECT 
    ss.service_id,
    ROUND(ss.score, 2) as score,
    ROW_NUMBER() OVER (ORDER BY ss.score DESC) as rank,
    ss.views_now,
    ss.views_prev,
    ROUND(ss.conv_now, 4) as conv_now,
    ROUND(ss.conv_prev, 4) as conv_prev,
    ss.bookings_now,
    ss.purchases_now,
    ss.revenue_now
  FROM scored_services ss
  WHERE ss.score > 0
  ORDER BY ss.score DESC
  LIMIT LEAST(p_max_count, GREATEST(p_min_count, (SELECT COUNT(*) FROM scored_services) * p_top_pct)::integer);
END;
$$;