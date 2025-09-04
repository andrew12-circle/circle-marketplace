-- Fix security linter warnings by adding SET search_path to all functions

-- Update get_concierge_context function to fix search path warning
CREATE OR REPLACE FUNCTION public.get_concierge_context(p_agent_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_stats RECORD;
  performance_stats RECORD;
  context JSONB;
BEGIN
  -- Get profile stats
  SELECT * INTO profile_stats FROM public.agent_profile_stats WHERE agent_id = p_agent_id;
  
  -- Get recent performance
  SELECT * INTO performance_stats FROM public.agent_performance_tracking 
  WHERE agent_id = p_agent_id 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Build context with estimates for missing data
  context := jsonb_build_object(
    'territory', jsonb_build_object(
      'cities', COALESCE(profile_stats.cities, '{}'),
      'zips', COALESCE(profile_stats.zips, '{}'),
      'price_band', COALESCE(profile_stats.price_band, '{"min": 300000, "max": 800000}'),
      'source', CASE WHEN profile_stats.cities IS NOT NULL THEN 'agent' ELSE 'estimated' END
    ),
    'production', jsonb_build_object(
      'closings_12m', COALESCE(profile_stats.closings_12m, performance_stats.transactions_closed, 6),
      'avg_price', COALESCE(profile_stats.avg_sale_price, performance_stats.volume_closed / NULLIF(performance_stats.transactions_closed, 0), 500000),
      'gci_12m', COALESCE(profile_stats.gci_12m, (performance_stats.volume_closed * 0.03), 150000),
      'source', CASE WHEN profile_stats.closings_12m IS NOT NULL THEN 'agent' ELSE 'estimated' END
    ),
    'pipeline', jsonb_build_object(
      'listings', COALESCE(profile_stats.pipeline_listings, 2),
      'pendings', COALESCE(profile_stats.pipeline_pendings, 1),
      'hot_buyers', COALESCE(profile_stats.pipeline_hot_buyers, 3),
      'source', CASE WHEN profile_stats.pipeline_listings IS NOT NULL THEN 'agent' ELSE 'estimated' END
    ),
    'marketing', jsonb_build_object(
      'budget', COALESCE(profile_stats.monthly_marketing_budget, 2000),
      'channels', COALESCE(profile_stats.channels, '{"social", "direct_mail", "online_ads"}'),
      'crm', COALESCE(profile_stats.crm, 'unknown'),
      'source', CASE WHEN profile_stats.monthly_marketing_budget IS NOT NULL THEN 'agent' ELSE 'estimated' END
    ),
    'goals', jsonb_build_object(
      'closings_90d', COALESCE(profile_stats.goal_closings_90d, 3),
      'closings_12m', COALESCE(profile_stats.goal_closings_12m, 12),
      'priority', COALESCE(profile_stats.priority_outcome, 'grow_listings'),
      'source', CASE WHEN profile_stats.goal_closings_90d IS NOT NULL THEN 'agent' ELSE 'estimated' END
    )
  );
  
  RETURN context;
END;
$$;

-- Update get_top_agent_purchases function to fix search path warning
CREATE OR REPLACE FUNCTION public.get_top_agent_purchases(p_market TEXT DEFAULT NULL, p_price_band JSONB DEFAULT NULL)
RETURNS TABLE(service_id UUID, purchase_frequency NUMERIC, avg_roi NUMERIC, service_title TEXT, category TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH top_performers AS (
    SELECT DISTINCT apt.agent_id
    FROM public.agent_performance_tracking apt
    WHERE apt.transactions_closed >= 12 -- Top performers
      AND apt.created_at >= now() - interval '12 months'
  ),
  purchase_patterns AS (
    SELECT 
      ste.service_id,
      COUNT(DISTINCT ste.user_id) as unique_buyers,
      AVG(ste.revenue_attributed) as avg_revenue,
      s.title,
      s.category
    FROM public.service_tracking_events ste
    JOIN public.services s ON s.id = ste.service_id
    WHERE ste.event_type = 'purchase'
      AND ste.user_id IN (SELECT agent_id FROM top_performers)
      AND ste.created_at >= now() - interval '6 months'
    GROUP BY ste.service_id, s.title, s.category
    HAVING COUNT(DISTINCT ste.user_id) >= 3
  )
  SELECT 
    pp.service_id,
    (pp.unique_buyers::NUMERIC / (SELECT COUNT(*) FROM top_performers)::NUMERIC) * 100 as purchase_frequency,
    COALESCE(pp.avg_revenue, 0) as avg_roi,
    pp.title as service_title,
    pp.category
  FROM purchase_patterns pp
  ORDER BY purchase_frequency DESC, avg_revenue DESC
  LIMIT 10;
END;
$$;

-- Update calculate_nba_score function to fix search path warning
CREATE OR REPLACE FUNCTION public.calculate_nba_score(
  p_agent_id UUID,
  p_service_id UUID,
  p_workflow_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  context JSONB;
  service_info RECORD;
  impact_score NUMERIC := 0;
  fit_score NUMERIC := 0;
  cost_score NUMERIC := 0;
  total_score NUMERIC;
BEGIN
  -- Get agent context
  SELECT public.get_concierge_context(p_agent_id) INTO context;
  
  -- Get service info
  SELECT * INTO service_info FROM public.services WHERE id = p_service_id;
  
  -- Calculate Impact (goal gap analysis)
  CASE p_workflow_type
    WHEN 'grow_listings' THEN
      impact_score := LEAST(100, (12 - (context->'production'->>'closings_12m')::INTEGER) * 10);
    WHEN 'sphere_nurture' THEN  
      impact_score := GREATEST(60, (context->'pipeline'->>'hot_buyers')::INTEGER * 15);
    WHEN 'geo_farm' THEN
      impact_score := 80; -- High impact for territory expansion
    ELSE
      impact_score := 70; -- Default moderate impact
  END CASE;
  
  -- Calculate Fit (niche and channel alignment)
  fit_score := 85; -- Default good fit, would enhance with more matching logic
  
  -- Calculate Cost efficiency
  cost_score := CASE 
    WHEN (context->'marketing'->>'budget')::NUMERIC >= 2000 THEN 90
    WHEN (context->'marketing'->>'budget')::NUMERIC >= 1000 THEN 70
    ELSE 50
  END;
  
  -- Final weighted score
  total_score := (impact_score * 0.4 + fit_score * 0.35 + cost_score * 0.25);
  
  RETURN jsonb_build_object(
    'total_score', total_score,
    'impact_score', impact_score,
    'fit_score', fit_score,
    'cost_score', cost_score,
    'reasoning', jsonb_build_object(
      'impact_reason', 'Based on goal gap and current production',
      'fit_reason', 'Matches agent profile and preferences', 
      'cost_reason', 'Fits within marketing budget parameters'
    )
  );
END;
$$;