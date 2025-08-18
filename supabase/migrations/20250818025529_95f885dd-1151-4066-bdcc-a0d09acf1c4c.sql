-- Create RPC function to get bestseller services based on actual sales performance
CREATE OR REPLACE FUNCTION public.get_bestseller_services(
  p_period text DEFAULT '30d',
  p_top_pct numeric DEFAULT 0.10,
  p_min_count integer DEFAULT 5,
  p_max_count integer DEFAULT 25
)
RETURNS TABLE(
  service_id uuid,
  sales_score numeric,
  rank bigint,
  total_revenue numeric,
  total_purchases bigint,
  purchase_velocity numeric,
  conversion_rate numeric,
  avg_purchase_value numeric
)
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