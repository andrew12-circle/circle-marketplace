-- Fix marketplace cache functions

-- Fix get_marketplace_cache function to use correct column name
CREATE OR REPLACE FUNCTION public.get_marketplace_cache(p_cache_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cached_data JSONB;
BEGIN
  SELECT cache_data INTO cached_data
  FROM public.marketplace_cache
  WHERE cache_key = p_cache_key
    AND expires_at > now();
  
  RETURN COALESCE(cached_data, 'null'::jsonb);
END;
$$;

-- Fix warm_marketplace_cache function with proper column names and GROUP BY
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

  -- Get active vendors with basic info (fixed GROUP BY issue)
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

  -- Cache trending services (use cache_data column)
  INSERT INTO public.marketplace_cache (cache_key, cache_data, expires_at)
  VALUES (
    'trending_services_7d',
    COALESCE(trending_services, '[]'::jsonb),
    now() + interval '5 minutes'
  )
  ON CONFLICT (cache_key) DO UPDATE SET
    cache_data = EXCLUDED.cache_data,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();

  -- Cache vendors data (use cache_data column)
  INSERT INTO public.marketplace_cache (cache_key, cache_data, expires_at)
  VALUES (
    'active_vendors',
    COALESCE(vendors_data, '[]'::jsonb),
    now() + interval '10 minutes'
  )
  ON CONFLICT (cache_key) DO UPDATE SET
    cache_data = EXCLUDED.cache_data,
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