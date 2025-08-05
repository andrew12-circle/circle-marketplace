-- 1. DATABASE OPTIMIZATIONS: Add critical indexes for heavy queries (avoiding duplicates)

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

-- Create queue system table for heavy operations if it doesn't exist
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

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'background_jobs' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;