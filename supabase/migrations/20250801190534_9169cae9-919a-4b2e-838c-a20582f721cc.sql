-- Create vendor analytics views and functions
CREATE OR REPLACE VIEW vendor_service_analytics AS
SELECT 
  s.vendor_id,
  s.id as service_id,
  s.title,
  s.category,
  s.created_at,
  COALESCE(sv.total_views, 0) as total_views,
  COALESCE(cb.total_bookings, 0) as total_bookings,
  COALESCE(cb.pending_bookings, 0) as pending_bookings,
  COALESCE(cb.completed_bookings, 0) as completed_bookings,
  COALESCE(sr.avg_rating, 0) as avg_rating,
  COALESCE(sr.total_reviews, 0) as total_reviews,
  COALESCE(saved.save_count, 0) as save_count,
  -- Calculate conversion rate (bookings / views)
  CASE 
    WHEN COALESCE(sv.total_views, 0) > 0 
    THEN ROUND((COALESCE(cb.total_bookings, 0)::numeric / sv.total_views * 100), 2)
    ELSE 0 
  END as conversion_rate
FROM services s
LEFT JOIN (
  SELECT service_id, COUNT(*) as total_views
  FROM service_views 
  GROUP BY service_id
) sv ON s.id = sv.service_id
LEFT JOIN (
  SELECT 
    service_id, 
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings
  FROM consultation_bookings 
  GROUP BY service_id
) cb ON s.id = cb.service_id
LEFT JOIN (
  SELECT 
    service_id,
    ROUND(AVG(rating)::numeric, 2) as avg_rating,
    COUNT(*) as total_reviews
  FROM service_reviews 
  GROUP BY service_id
) sr ON s.id = sr.service_id
LEFT JOIN (
  SELECT service_id, COUNT(*) as save_count
  FROM saved_services 
  GROUP BY service_id
) saved ON s.id = saved.service_id;

-- Create function to get vendor dashboard stats
CREATE OR REPLACE FUNCTION get_vendor_dashboard_stats(p_vendor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  stats jsonb;
  total_services integer;
  total_views integer;
  total_bookings integer;
  total_revenue numeric;
  avg_conversion_rate numeric;
  avg_rating numeric;
  total_reviews integer;
  monthly_views integer;
  monthly_bookings integer;
  trending_score integer;
BEGIN
  -- Get basic counts
  SELECT 
    COUNT(*),
    COALESCE(SUM(total_views), 0),
    COALESCE(SUM(total_bookings), 0),
    COALESCE(AVG(conversion_rate), 0),
    COALESCE(AVG(avg_rating), 0),
    COALESCE(SUM(total_reviews), 0)
  INTO 
    total_services,
    total_views,
    total_bookings,
    avg_conversion_rate,
    avg_rating,
    total_reviews
  FROM vendor_service_analytics 
  WHERE vendor_id = p_vendor_id;

  -- Calculate monthly metrics (last 30 days)
  SELECT 
    COALESCE(COUNT(DISTINCT sv.id), 0),
    COALESCE(COUNT(DISTINCT cb.id), 0)
  INTO 
    monthly_views,
    monthly_bookings
  FROM services s
  LEFT JOIN service_views sv ON s.id = sv.service_id AND sv.viewed_at > now() - interval '30 days'
  LEFT JOIN consultation_bookings cb ON s.id = cb.service_id AND cb.created_at > now() - interval '30 days'
  WHERE s.vendor_id = p_vendor_id;

  -- Calculate estimated revenue (mock calculation for now)
  total_revenue := total_bookings * 150; -- Average booking value

  -- Calculate trending score based on recent activity
  trending_score := LEAST(100, GREATEST(0, 
    (monthly_views * 2) + (monthly_bookings * 10) + (total_reviews * 5)
  ));

  -- Build stats object
  stats := jsonb_build_object(
    'total_services', COALESCE(total_services, 0),
    'total_views', COALESCE(total_views, 0),
    'total_bookings', COALESCE(total_bookings, 0),
    'monthly_revenue', COALESCE(total_revenue, 0),
    'conversion_rate', COALESCE(avg_conversion_rate, 0),
    'avg_rating', COALESCE(avg_rating, 0),
    'total_reviews', COALESCE(total_reviews, 0),
    'trending_score', COALESCE(trending_score, 0),
    'monthly_views', COALESCE(monthly_views, 0),
    'monthly_bookings', COALESCE(monthly_bookings, 0)
  );

  RETURN stats;
END;
$$;