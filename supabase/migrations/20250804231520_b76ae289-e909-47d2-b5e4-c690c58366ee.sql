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

-- Create materialized view for vendor analytics to reduce heavy joins
CREATE MATERIALIZED VIEW IF NOT EXISTS vendor_service_analytics AS
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

-- Create indexes on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_service_analytics_vendor 
ON vendor_service_analytics (vendor_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_vendor_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY vendor_service_analytics;
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

-- Create function to process jobs
CREATE OR REPLACE FUNCTION process_background_job(job_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_record RECORD;
  result JSONB;
BEGIN
  -- Get and lock the job
  SELECT * INTO job_record
  FROM background_jobs
  WHERE id = job_id AND status = 'pending'
  FOR UPDATE SKIP LOCKED;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job not found or already processed');
  END IF;
  
  -- Mark job as started
  UPDATE background_jobs 
  SET status = 'processing', started_at = now(), attempts = attempts + 1
  WHERE id = job_id;
  
  -- Process based on job type
  CASE job_record.job_type
    WHEN 'refresh_analytics' THEN
      PERFORM refresh_vendor_analytics();
      result := jsonb_build_object('success', true, 'message', 'Analytics refreshed');
    
    WHEN 'cleanup_cache' THEN
      -- This would be handled by the application layer
      result := jsonb_build_object('success', true, 'message', 'Cache cleanup queued');
    
    ELSE
      result := jsonb_build_object('success', false, 'error', 'Unknown job type');
  END CASE;
  
  -- Mark job as completed or failed
  IF result->>'success' = 'true' THEN
    UPDATE background_jobs 
    SET status = 'completed', completed_at = now()
    WHERE id = job_id;
  ELSE
    UPDATE background_jobs 
    SET status = 'failed', error_message = result->>'error'
    WHERE id = job_id;
  END IF;
  
  RETURN result;
END;
$$;