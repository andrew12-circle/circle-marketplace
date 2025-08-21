-- Phase 1: Add missing RPC and performance indexes

-- Create the missing security rate limit check function
CREATE OR REPLACE FUNCTION public.check_security_operation_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  operation_count integer;
BEGIN
  -- Count security operations in last 5 minutes for current user
  SELECT COUNT(*) INTO operation_count
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type LIKE '%security%'
    AND created_at > now() - interval '5 minutes';
    
  -- Allow up to 50 operations per 5 minutes (reasonable for admin work)
  RETURN operation_count < 50;
END;
$$;

-- Add app_config flags for global feature control
INSERT INTO public.app_config (
  id,
  marketplace_enabled,
  auto_heal_enabled, 
  security_monitoring_global,
  top_deals_enabled,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  true,
  false, -- Disable auto-heal by default in production
  false, -- Disable global security monitoring
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Performance indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_sort_order_created 
ON public.services(sort_order ASC, created_at DESC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_tracking_events_service_created
ON public.service_tracking_events(service_id, created_at DESC);

-- Index for security events rate limiting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_user_type_time
ON public.security_events(user_id, event_type, created_at DESC);