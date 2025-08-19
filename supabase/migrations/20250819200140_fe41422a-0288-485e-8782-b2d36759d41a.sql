-- Fix get_trending_services function - replace problematic SELECT with RETURN QUERY
CREATE OR REPLACE FUNCTION public.get_trending_services(p_period text DEFAULT '7d'::text, p_top_pct numeric DEFAULT 0.15, p_min_count integer DEFAULT 8, p_max_count integer DEFAULT 40)
 RETURNS TABLE(service_id uuid, score numeric, rank bigint, views_now bigint, views_prev bigint, conv_now numeric, conv_prev numeric, bookings_now bigint, purchases_now bigint, revenue_now numeric)
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
  RETURN QUERY
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

-- Fix get_bestseller_services function - replace problematic SELECT with RETURN QUERY  
CREATE OR REPLACE FUNCTION public.get_bestseller_services(p_period text DEFAULT '30d'::text, p_top_pct numeric DEFAULT 0.10, p_min_count integer DEFAULT 5, p_max_count integer DEFAULT 25)
 RETURNS TABLE(service_id uuid, sales_score numeric, rank bigint, total_revenue numeric, total_purchases bigint, purchase_velocity numeric, conversion_rate numeric, avg_purchase_value numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  days_back integer;
BEGIN
  -- Parse period
  CASE p_period
    WHEN '7d' THEN days_back := 7;
    WHEN '30d' THEN days_back := 30;
    WHEN '90d' THEN days_back := 90;
    ELSE days_back := 30;
  END CASE;

  -- Get sales performance metrics
  RETURN QUERY
  WITH sales_metrics AS (
    SELECT 
      ste.service_id,
      -- Revenue and purchase metrics
      COALESCE(SUM(CASE WHEN ste.event_type = 'purchase' THEN ste.revenue_attributed END), 0) as total_revenue,
      COUNT(CASE WHEN ste.event_type = 'purchase' THEN 1 END) as total_purchases,
      COUNT(CASE WHEN ste.event_type = 'view' THEN 1 END) as total_views,
      COUNT(CASE WHEN ste.event_type = 'booking' THEN 1 END) as total_bookings,
      
      -- Calculate purchase velocity (purchases per day)
      COUNT(CASE WHEN ste.event_type = 'purchase' THEN 1 END)::numeric / days_back as purchase_velocity,
      
      -- Calculate conversion rate (purchases / views)
      CASE WHEN COUNT(CASE WHEN ste.event_type = 'view' THEN 1 END) > 0
           THEN COUNT(CASE WHEN ste.event_type = 'purchase' THEN 1 END)::numeric / 
                COUNT(CASE WHEN ste.event_type = 'view' THEN 1 END)::numeric
           ELSE 0 END as conversion_rate,
           
      -- Average purchase value
      CASE WHEN COUNT(CASE WHEN ste.event_type = 'purchase' THEN 1 END) > 0
           THEN COALESCE(SUM(CASE WHEN ste.event_type = 'purchase' THEN ste.revenue_attributed END), 0) / 
                COUNT(CASE WHEN ste.event_type = 'purchase' THEN 1 END)::numeric
           ELSE 0 END as avg_purchase_value
           
    FROM public.service_tracking_events ste
    WHERE ste.created_at >= now() - (days_back || ' days')::interval
    GROUP BY ste.service_id
  ),
  scored_services AS (
    SELECT 
      sm.service_id,
      sm.total_revenue,
      sm.total_purchases,
      sm.purchase_velocity,
      sm.conversion_rate,
      sm.avg_purchase_value,
      
      -- Calculate sales score
      -- Revenue: 50%, Purchase velocity: 25%, Conversion rate: 15%, Average value: 10%
      (
        (LEAST(1.0, sm.total_revenue / 5000.0) * 0.50) +  -- Revenue normalized to $5k
        (LEAST(1.0, sm.purchase_velocity / 3.0) * 0.25) + -- Velocity normalized to 3/day
        (LEAST(1.0, sm.conversion_rate / 0.05) * 0.15) +  -- Conversion normalized to 5%
        (LEAST(1.0, sm.avg_purchase_value / 500.0) * 0.10) -- Avg value normalized to $500
      ) as sales_score
      
    FROM sales_metrics sm
    WHERE 
      -- Baseline filter: must have actual sales activity
      sm.total_purchases >= 2 AND 
      sm.total_revenue > 0 AND
      sm.total_views >= 10  -- Basic engagement requirement
  )
  SELECT 
    ss.service_id,
    ROUND(ss.sales_score, 4) as sales_score,
    ROW_NUMBER() OVER (ORDER BY ss.sales_score DESC) as rank,
    ss.total_revenue,
    ss.total_purchases,
    ROUND(ss.purchase_velocity, 2) as purchase_velocity,
    ROUND(ss.conversion_rate, 4) as conversion_rate,
    ROUND(ss.avg_purchase_value, 2) as avg_purchase_value
  FROM scored_services ss
  WHERE ss.sales_score > 0
  ORDER BY ss.sales_score DESC
  LIMIT LEAST(p_max_count, GREATEST(p_min_count, 
    (SELECT COUNT(*) FROM scored_services) * p_top_pct)::integer);
END;
$function$;