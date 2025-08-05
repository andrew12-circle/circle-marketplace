-- Fix security issues from linter

-- 1. Enable RLS on the new vendor_analytics_cache table
ALTER TABLE vendor_analytics_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_analytics_cache
CREATE POLICY "Analytics cache viewable by admins" ON vendor_analytics_cache
FOR SELECT USING (get_user_admin_status());

CREATE POLICY "System can update analytics cache" ON vendor_analytics_cache
FOR ALL USING (true);

-- 2. Fix function search path issues
CREATE OR REPLACE FUNCTION refresh_vendor_analytics_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Clear existing cache
  DELETE FROM vendor_analytics_cache;
  
  -- Populate with fresh data
  INSERT INTO vendor_analytics_cache (
    vendor_id, vendor_name, total_services, total_views, 
    total_bookings, avg_rating, total_reviews, conversion_rate
  )
  SELECT 
    v.id as vendor_id,
    v.name as vendor_name,
    COUNT(s.id) as total_services,
    COALESCE(SUM(sv.view_count), 0) as total_views,
    COALESCE(SUM(cb.booking_count), 0) as total_bookings,
    COALESCE(AVG(sr.avg_rating), 0) as avg_rating,
    COALESCE(SUM(sr.review_count), 0) as total_reviews,
    CASE 
      WHEN COALESCE(SUM(sv.view_count), 0) > 0 
      THEN (COALESCE(SUM(cb.booking_count), 0)::float / COALESCE(SUM(sv.view_count), 1)::float) * 100 
      ELSE 0 
    END as conversion_rate
  FROM vendors v
  LEFT JOIN services s ON s.vendor_id = v.id
  LEFT JOIN (
    SELECT service_id, COUNT(*) as view_count
    FROM service_views 
    GROUP BY service_id
  ) sv ON sv.service_id = s.id
  LEFT JOIN (
    SELECT service_id, COUNT(*) as booking_count
    FROM consultation_bookings 
    GROUP BY service_id
  ) cb ON cb.service_id = s.id
  LEFT JOIN (
    SELECT service_id, AVG(rating) as avg_rating, COUNT(*) as review_count
    FROM service_reviews 
    GROUP BY service_id
  ) sr ON sr.service_id = s.id
  GROUP BY v.id, v.name;
END;
$$;

-- Update get_vendor_dashboard_stats function to set search path
CREATE OR REPLACE FUNCTION public.get_vendor_dashboard_stats(p_vendor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
  -- Use cached analytics if available
  SELECT total_services, total_views, total_bookings, avg_rating, total_reviews, conversion_rate
  INTO total_services, total_views, total_bookings, avg_rating, total_reviews, avg_conversion_rate
  FROM vendor_analytics_cache
  WHERE vendor_id = p_vendor_id;

  -- If no cached data, calculate basic stats
  IF total_services IS NULL THEN
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
  END IF;

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