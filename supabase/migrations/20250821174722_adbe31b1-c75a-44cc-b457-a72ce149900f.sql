-- Phase 1B: Add performance indexes (non-concurrent for now)

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_services_sort_order_created 
ON public.services(sort_order ASC, created_at DESC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_service_tracking_events_service_created
ON public.service_tracking_events(service_id, created_at DESC);

-- Index for security events rate limiting
CREATE INDEX IF NOT EXISTS idx_security_events_user_type_time
ON public.security_events(user_id, event_type, created_at DESC);