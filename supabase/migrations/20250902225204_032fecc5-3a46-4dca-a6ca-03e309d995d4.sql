-- Create function to get service metrics summary for admin dashboard
CREATE OR REPLACE FUNCTION public.get_service_metrics_summary(days_back integer DEFAULT 30)
RETURNS TABLE(
  service_id uuid,
  total_views bigint,
  total_clicks bigint,
  total_purchases bigint,
  conversion_rate numeric,
  revenue_attributed numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ste.service_id,
    COUNT(CASE WHEN ste.event_type = 'view' THEN 1 END) as total_views,
    COUNT(CASE WHEN ste.event_type = 'click' THEN 1 END) as total_clicks,
    COUNT(CASE WHEN ste.event_type = 'purchase' THEN 1 END) as total_purchases,
    CASE 
      WHEN COUNT(CASE WHEN ste.event_type = 'view' THEN 1 END) > 0 THEN
        ROUND((COUNT(CASE WHEN ste.event_type = 'purchase' THEN 1 END)::numeric / 
               COUNT(CASE WHEN ste.event_type = 'view' THEN 1 END)::numeric) * 100, 2)
      ELSE 0
    END as conversion_rate,
    COALESCE(SUM(ste.revenue_attributed), 0) as revenue_attributed
  FROM public.service_tracking_events ste
  WHERE ste.created_at >= now() - (days_back || ' days')::interval
  GROUP BY ste.service_id
  HAVING COUNT(*) > 0
  ORDER BY revenue_attributed DESC, total_views DESC;
END;
$function$;

-- Create function to get admin analytics summary
CREATE OR REPLACE FUNCTION public.get_admin_analytics_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  total_revenue numeric := 0;
  total_services integer := 0;
  active_vendors integer := 0;
  overall_conversion_rate numeric := 0;
  top_services jsonb := '[]'::jsonb;
BEGIN
  -- Check admin access
  IF NOT get_user_admin_status() THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;

  -- Get total revenue from last 30 days
  SELECT COALESCE(SUM(revenue_attributed), 0) INTO total_revenue
  FROM public.service_tracking_events
  WHERE created_at >= now() - interval '30 days'
    AND event_type = 'purchase';

  -- Get total active services
  SELECT COUNT(*) INTO total_services
  FROM public.services
  WHERE is_active = true;

  -- Get active vendors count
  SELECT COUNT(*) INTO active_vendors
  FROM public.vendors
  WHERE is_active = true
    AND approval_status IN ('approved', 'auto_approved');

  -- Calculate overall conversion rate
  WITH conversion_data AS (
    SELECT 
      COUNT(CASE WHEN event_type = 'view' THEN 1 END) as total_views,
      COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as total_purchases
    FROM public.service_tracking_events
    WHERE created_at >= now() - interval '30 days'
  )
  SELECT 
    CASE 
      WHEN total_views > 0 THEN ROUND((total_purchases::numeric / total_views::numeric) * 100, 2)
      ELSE 0
    END INTO overall_conversion_rate
  FROM conversion_data;

  -- Get top performing services
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'title', s.title,
      'category', s.category,
      'revenue', COALESCE(metrics.revenue, 0),
      'conversions', COALESCE(metrics.purchases, 0)
    )
  ) INTO top_services
  FROM public.services s
  LEFT JOIN (
    SELECT 
      service_id,
      SUM(CASE WHEN event_type = 'purchase' THEN revenue_attributed ELSE 0 END) as revenue,
      COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as purchases
    FROM public.service_tracking_events
    WHERE created_at >= now() - interval '30 days'
    GROUP BY service_id
  ) metrics ON s.id = metrics.service_id
  WHERE s.is_active = true
  ORDER BY COALESCE(metrics.revenue, 0) DESC
  LIMIT 10;

  -- Build result
  result := jsonb_build_object(
    'totalRevenue', total_revenue,
    'totalServices', total_services,
    'activeVendors', active_vendors,
    'conversionRate', overall_conversion_rate,
    'topPerformingServices', COALESCE(top_services, '[]'::jsonb),
    'generatedAt', now()
  );

  RETURN result;
END;
$function$;