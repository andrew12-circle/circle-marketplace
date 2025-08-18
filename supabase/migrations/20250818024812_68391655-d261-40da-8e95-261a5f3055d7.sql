-- Create RPC function to get trending services based on recent performance metrics
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
AS $function$
DECLARE
  days_back integer;
  total_services bigint;
  target_count integer;
BEGIN
  -- Parse period
  CASE p_period
    WHEN '7d' THEN days_back := 7;
    WHEN '30d' THEN days_back := 30;
    ELSE days_back := 7;
  END CASE;

  -- Get recent and previous period metrics with performance scoring
  WITH service_metrics AS (
    SELECT 
      ste.service_id,
      -- Current period (last N days)
      COUNT(CASE WHEN ste.created_at >= now() - (days_back || ' days')::interval 
                 AND ste.event_type = 'view' THEN 1 END) as views_now,
      COUNT(CASE WHEN ste.created_at >= now() - (days_back || ' days')::interval 
                 AND ste.event_type = 'click' THEN 1 END) as clicks_now,
      COUNT(CASE WHEN ste.created_at >= now() - (days_back || ' days')::interval 
                 AND ste.event_type = 'booking' THEN 1 END) as bookings_now,
      COUNT(CASE WHEN ste.created_at >= now() - (days_back || ' days')::interval 
                 AND ste.event_type = 'purchase' THEN 1 END) as purchases_now,
      COALESCE(SUM(CASE WHEN ste.created_at >= now() - (days_back || ' days')::interval 
                       THEN ste.revenue_attributed END), 0) as revenue_now,
      
      -- Previous period (N days before that)
      COUNT(CASE WHEN ste.created_at >= now() - (days_back * 2 || ' days')::interval 
                 AND ste.created_at < now() - (days_back || ' days')::interval
                 AND ste.event_type = 'view' THEN 1 END) as views_prev,
      COUNT(CASE WHEN ste.created_at >= now() - (days_back * 2 || ' days')::interval 
                 AND ste.created_at < now() - (days_back || ' days')::interval
                 AND ste.event_type = 'booking' THEN 1 END) as bookings_prev,
      COUNT(CASE WHEN ste.created_at >= now() - (days_back * 2 || ' days')::interval 
                 AND ste.created_at < now() - (days_back || ' days')::interval
                 AND ste.event_type = 'purchase' THEN 1 END) as purchases_prev
    FROM public.service_tracking_events ste
    WHERE ste.created_at >= now() - (days_back * 2 || ' days')::interval
    GROUP BY ste.service_id
  ),
  scored_services AS (
    SELECT 
      sm.service_id,
      sm.views_now,
      sm.views_prev,
      sm.bookings_now,
      sm.purchases_now,
      sm.revenue_now,
      
      -- Calculate conversion rates
      CASE WHEN sm.views_now > 0 
           THEN (sm.bookings_now + sm.purchases_now)::numeric / sm.views_now 
           ELSE 0 END as conv_now,
      CASE WHEN sm.views_prev > 0 
           THEN (sm.bookings_prev + sm.purchases_prev)::numeric / sm.views_prev 
           ELSE 0 END as conv_prev,
      
      -- Calculate growth metrics
      LEAST(3.0, GREATEST(0.0, 
        CASE WHEN sm.views_prev > 0 
             THEN (sm.views_now - sm.views_prev)::numeric / GREATEST(sm.views_prev, 5)
             ELSE CASE WHEN sm.views_now >= 20 THEN 1.0 ELSE 0.0 END 
        END
      )) as growth_views,
      
      LEAST(0.5, GREATEST(0.0, 
        CASE WHEN sm.views_now > 0 AND sm.views_prev > 0
             THEN ((sm.bookings_now + sm.purchases_now)::numeric / sm.views_now) - 
                  ((sm.bookings_prev + sm.purchases_prev)::numeric / sm.views_prev)
             ELSE 0 
        END
      )) as growth_conv,
      
      -- Calculate velocity (bookings + purchases per day)
      LEAST(1.0, ((sm.bookings_now + sm.purchases_now)::numeric / days_back) / 2.0) as velocity_norm,
      
      -- Revenue normalization
      LEAST(1.0, sm.revenue_now / 1000.0) as revenue_norm
      
    FROM service_metrics sm
    WHERE 
      -- Baseline filter to reduce noise
      sm.views_now >= 20 OR sm.clicks_now >= 5 OR (sm.bookings_now + sm.purchases_now) >= 3
  ),
  final_scores AS (
    SELECT 
      ss.*,
      -- Final score calculation
      (0.5 * ss.growth_views + 
       0.3 * ss.growth_conv + 
       0.15 * ss.velocity_norm + 
       0.05 * ss.revenue_norm) as final_score
    FROM scored_services ss
  )
  SELECT 
    fs.service_id,
    ROUND(fs.final_score, 4) as score,
    ROW_NUMBER() OVER (ORDER BY fs.final_score DESC) as rank,
    fs.views_now,
    fs.views_prev,
    ROUND(fs.conv_now, 4) as conv_now,
    ROUND(fs.conv_prev, 4) as conv_prev,
    fs.bookings_now,
    fs.purchases_now,
    fs.revenue_now
  FROM final_scores fs
  WHERE fs.final_score > 0
  ORDER BY fs.final_score DESC
  LIMIT LEAST(p_max_count, GREATEST(p_min_count, 
    (SELECT COUNT(*) FROM final_scores) * p_top_pct)::integer);
END;
$function$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_service_tracking_events_service_created 
ON public.service_tracking_events(service_id, created_at DESC);