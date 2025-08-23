-- Phase 2: Database Indexes and Caching Optimizations (Fixed)

-- 1. Create indexes for critical performance paths (without CONCURRENTLY in transaction)
CREATE INDEX IF NOT EXISTS idx_service_tracking_events_service_created 
ON service_tracking_events (service_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_tracking_events_event_created 
ON service_tracking_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_reviews_service_created 
ON service_reviews (service_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_questions_vendor_number 
ON vendor_questions (vendor_id, question_number);

CREATE INDEX IF NOT EXISTS idx_client_errors_created_type 
ON client_errors (created_at DESC, error_type);

CREATE INDEX IF NOT EXISTS idx_security_events_created_type 
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