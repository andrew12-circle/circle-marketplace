-- Performance optimization: Add strategic indexes for frequently queried tables

-- Index for service tracking events (used in analytics and trending calculations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_tracking_events_service_created 
ON public.service_tracking_events (service_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_tracking_events_event_type_created 
ON public.service_tracking_events (event_type, created_at DESC);

-- Index for marketplace cache lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_cache_key_expires 
ON public.marketplace_cache (cache_key, expires_at DESC);

-- Index for service views (used in trending calculations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_views_service_created 
ON public.service_views (service_id, created_at DESC);

-- Index for vendors active lookup with sort order
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_active_approved_sort 
ON public.vendors (is_active, approval_status, sort_order, auto_score DESC) 
WHERE is_active = true AND approval_status = 'approved';

-- Index for services active lookup with sort order
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_active_sort 
ON public.services (is_active, sort_order, created_at DESC) 
WHERE is_active = true;

-- Index for content engagement events analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_engagement_events_content_created 
ON public.content_engagement_events (content_id, created_at DESC);

-- Index for funnel events analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnel_events_anon_created 
ON public.funnel_events (anon_id, created_at DESC);

-- Index for agent performance tracking monthly aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_performance_agent_month 
ON public.agent_performance_tracking (agent_id, month_year);

-- Index for co-pay requests status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_co_pay_requests_status_created 
ON public.co_pay_requests (status, compliance_status, created_at DESC);

-- Update statistics to help query planner
ANALYZE public.service_tracking_events;
ANALYZE public.marketplace_cache;
ANALYZE public.service_views;
ANALYZE public.vendors;
ANALYZE public.services;
ANALYZE public.content_engagement_events;
ANALYZE public.funnel_events;