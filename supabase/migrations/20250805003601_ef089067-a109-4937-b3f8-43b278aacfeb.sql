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

-- Create function to get vendor analytics (replaces heavy joins)
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
    COUNT(*) as service_count,
    COALESCE(SUM((
      SELECT COUNT(*) FROM service_views sv WHERE sv.service_id = s.id
    )), 0) as view_count,
    COALESCE(SUM((
      SELECT COUNT(*) FROM consultation_bookings cb WHERE cb.service_id = s.id
    )), 0) as booking_count
  INTO total_services, total_views, total_bookings
  FROM services s 
  WHERE s.vendor_id = p_vendor_id;

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

  -- Calculate conversion rate
  avg_conversion_rate := CASE 
    WHEN total_views > 0 THEN (total_bookings::numeric / total_views::numeric) * 100
    ELSE 0
  END;

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

-- Create queue system tables for heavy operations
CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  job_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 5,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for job queue processing
CREATE INDEX IF NOT EXISTS idx_background_jobs_queue 
ON background_jobs (status, priority DESC, scheduled_at ASC);

-- Enable RLS on background jobs
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;

-- Policy for system to manage jobs
CREATE POLICY "System can manage background jobs" ON background_jobs
FOR ALL USING (true);

-- Policy for admins to view jobs
CREATE POLICY "Admins can view background jobs" ON background_jobs
FOR SELECT USING (get_user_admin_status());