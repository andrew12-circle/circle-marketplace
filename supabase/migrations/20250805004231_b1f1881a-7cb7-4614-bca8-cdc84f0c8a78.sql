-- 1. DATABASE OPTIMIZATIONS: Add critical indexes for heavy queries

-- Index for marketplace vendor filtering by location
CREATE INDEX IF NOT EXISTS idx_vendors_location_search 
ON vendors (service_states, license_states, is_verified, rating DESC);

-- Index for marketplace service filtering 
CREATE INDEX IF NOT EXISTS idx_services_marketplace_search 
ON services (category, is_featured, sort_order, created_at DESC);

-- Index for RLS heavy queries - service views
CREATE INDEX IF NOT EXISTS idx_service_views_analytics 
ON service_views (service_id, viewed_at DESC, user_id);

-- Index for consultation bookings analytics
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_analytics 
ON consultation_bookings (service_id, created_at DESC, status);

-- Index for vendor agent activities
CREATE INDEX IF NOT EXISTS idx_vendor_agent_activities_time 
ON vendor_agent_activities (vendor_id, created_at DESC, agent_id);

-- Composite index for co-pay request status filtering
CREATE INDEX IF NOT EXISTS idx_co_pay_requests_status_filter 
ON co_pay_requests (vendor_id, agent_id, compliance_status, created_at DESC);

-- Index for content engagement events analytics
CREATE INDEX IF NOT EXISTS idx_content_engagement_creator 
ON content_engagement_events (creator_id, created_at DESC, event_type);

-- Index for point allocations queries
CREATE INDEX IF NOT EXISTS idx_point_allocations_active 
ON point_allocations (agent_id, vendor_id, status, start_date, end_date);

-- Create table for pre-computed vendor analytics to reduce heavy joins
CREATE TABLE IF NOT EXISTS vendor_analytics_cache (
  vendor_id UUID PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  total_services INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  avg_rating NUMERIC NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for vendor analytics cache
CREATE INDEX IF NOT EXISTS idx_vendor_analytics_cache_updated 
ON vendor_analytics_cache (last_updated DESC);

-- Function to refresh vendor analytics cache
CREATE OR REPLACE FUNCTION refresh_vendor_analytics_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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