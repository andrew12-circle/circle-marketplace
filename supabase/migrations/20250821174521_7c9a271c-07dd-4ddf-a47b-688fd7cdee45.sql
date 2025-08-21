-- Phase 1: Add missing RPC and app_config columns, plus performance indexes

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

-- Add new columns to app_config for global feature control
ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS marketplace_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_heal_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS security_monitoring_global boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS top_deals_enabled boolean DEFAULT true;

-- Set initial values for existing row
UPDATE public.app_config SET
  marketplace_enabled = true,
  auto_heal_enabled = false,
  security_monitoring_global = false,
  top_deals_enabled = true
WHERE marketplace_enabled IS NULL;

-- Performance indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_sort_order_created 
ON public.services(sort_order ASC, created_at DESC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_tracking_events_service_created
ON public.service_tracking_events(service_id, created_at DESC);

-- Index for security events rate limiting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_user_type_time
ON public.security_events(user_id, event_type, created_at DESC);