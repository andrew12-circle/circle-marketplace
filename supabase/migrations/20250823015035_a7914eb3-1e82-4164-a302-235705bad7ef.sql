-- Phase 2: Database Indexes and Caching Optimizations

-- 1. Create indexes for critical performance paths
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_tracking_events_service_created 
ON service_tracking_events (service_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_tracking_events_event_created 
ON service_tracking_events (event_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_reviews_service_created 
ON service_reviews (service_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_questions_vendor_number 
ON vendor_questions (vendor_id, question_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_errors_created_type 
ON client_errors (created_at DESC, error_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_created_type 
ON security_events (created_at DESC, event_type);

-- 2. Create marketplace cache table for prefiltered data
CREATE TABLE IF NOT EXISTS public.marketplace_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS idx_marketplace_cache_key_expires 
ON marketplace_cache (cache_key, expires_at);

-- Enable RLS on cache table
ALTER TABLE public.marketplace_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cache (since it contains public marketplace data)
CREATE POLICY "Public read access to marketplace cache" 
ON public.marketplace_cache 
FOR SELECT 
USING (expires_at > now());

-- Allow system to manage cache
CREATE POLICY "System can manage marketplace cache" 
ON public.marketplace_cache 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 3. Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_marketplace_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.marketplace_cache 
  WHERE expires_at <= now();
END;
$$;

-- 4. Create cache warming function
CREATE OR REPLACE FUNCTION public.warm_marketplace_cache()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trending_services JSONB;
  vendors_data JSONB;
  result JSONB;
BEGIN
  -- Get trending services with current score
  SELECT json_agg(
    json_build_object(
      'service_id', t.service_id,
      'score', t.score,
      'rank', t.rank,
      'views_now', t.views_now,
      'views_prev', t.views_prev,
      'conv_now', t.conv_now,
      'conv_prev', t.conv_prev,
      'bookings_now', t.bookings_now,
      'purchases_now', t.purchases_now,
      'revenue_now', t.revenue_now
    )
  ) INTO trending_services
  FROM public.get_trending_services('7d', 0.15, 8, 40) t;

  -- Get active vendors with basic info
  SELECT json_agg(
    json_build_object(
      'id', v.id,
      'name', v.name,
      'auto_score', v.auto_score,
      'co_marketing_agents', v.co_marketing_agents,
      'is_verified', v.is_verified,
      'circle_commission_percentage', v.circle_commission_percentage,
      'sort_order', v.sort_order
    )
  ) INTO vendors_data
  FROM public.vendors v
  WHERE v.is_active = true 
    AND v.approval_status = 'approved'
  ORDER BY v.sort_order, v.auto_score DESC
  LIMIT 50;

  -- Cache trending services
  INSERT INTO public.marketplace_cache (cache_key, data, expires_at)
  VALUES (
    'trending_services_7d',
    COALESCE(trending_services, '[]'::jsonb),
    now() + interval '5 minutes'
  )
  ON CONFLICT (cache_key) DO UPDATE SET
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();

  -- Cache vendors data
  INSERT INTO public.marketplace_cache (cache_key, data, expires_at)
  VALUES (
    'active_vendors',
    COALESCE(vendors_data, '[]'::jsonb),
    now() + interval '10 minutes'
  )
  ON CONFLICT (cache_key) DO UPDATE SET
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();

  result := json_build_object(
    'success', true,
    'trending_services_count', COALESCE(jsonb_array_length(trending_services), 0),
    'vendors_count', COALESCE(jsonb_array_length(vendors_data), 0),
    'cached_at', now()
  );

  RETURN result;
END;
$$;

-- 5. Create function to get cached data
CREATE OR REPLACE FUNCTION public.get_marketplace_cache(p_cache_key TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cached_data JSONB;
BEGIN
  SELECT data INTO cached_data
  FROM public.marketplace_cache
  WHERE cache_key = p_cache_key
    AND expires_at > now();
  
  RETURN COALESCE(cached_data, 'null'::jsonb);
END;
$$;

-- 6. Update vendor stats trigger for better performance
CREATE OR REPLACE FUNCTION public.update_vendor_stats_efficient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_vendor_id uuid;
  stats jsonb;
  computed_count integer;
  effective_count integer;
BEGIN
  -- Determine which vendor to update
  IF TG_OP = 'DELETE' THEN
    target_vendor_id := OLD.vendor_id;
  ELSE
    target_vendor_id := NEW.vendor_id;
  END IF;

  -- Only update if vendor_id exists
  IF target_vendor_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Calculate stats efficiently
  stats := calculate_vendor_stats(target_vendor_id);
  computed_count := (stats->>'computed_co_marketing_agents')::integer;
  
  -- Get effective count with seeding logic
  SELECT CASE 
    WHEN seed_active = true 
         AND (seed_expires_at IS NULL OR seed_expires_at > now()) 
         AND computed_count = 0 
    THEN COALESCE(seeded_co_marketing_agents, 0)
    ELSE computed_count 
  END INTO effective_count
  FROM vendors WHERE id = target_vendor_id;
  
  -- Update only if values changed
  UPDATE vendors 
  SET 
    computed_co_marketing_agents = computed_count,
    co_marketing_agents = effective_count,
    campaigns_funded = (stats->>'campaigns_funded')::integer,
    updated_at = now()
  WHERE id = target_vendor_id
    AND (
      computed_co_marketing_agents IS DISTINCT FROM computed_count OR
      co_marketing_agents IS DISTINCT FROM effective_count OR
      campaigns_funded IS DISTINCT FROM (stats->>'campaigns_funded')::integer
    );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 7. Create trigger to auto-cleanup cache
CREATE OR REPLACE FUNCTION public.trigger_cache_cleanup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Periodically clean up expired cache (every 100 inserts)
  IF random() < 0.01 THEN
    PERFORM public.cleanup_marketplace_cache();
  END IF;
  RETURN NEW;
END;
$$;

-- Apply the trigger
DROP TRIGGER IF EXISTS trigger_marketplace_cache_cleanup ON marketplace_cache;
CREATE TRIGGER trigger_marketplace_cache_cleanup
  AFTER INSERT ON marketplace_cache
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cache_cleanup();