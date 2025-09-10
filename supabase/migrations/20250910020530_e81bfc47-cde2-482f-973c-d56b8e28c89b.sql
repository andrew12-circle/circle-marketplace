-- Fix division by zero errors in enhanced analytics function
CREATE OR REPLACE FUNCTION public.get_web_analytics_enhanced(p_period TEXT DEFAULT '30d')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  time_filter TIMESTAMPTZ;
  result JSONB;
  session_metrics JSONB;
  traffic_sources JSONB;
  device_breakdown JSONB;
  geo_data JSONB;
  conversion_data JSONB;
  behavior_metrics JSONB;
BEGIN
  -- Check admin access
  IF NOT get_user_admin_status() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admins only';
  END IF;

  -- Set time filter
  CASE p_period
    WHEN '7d' THEN time_filter := now() - interval '7 days';
    WHEN '30d' THEN time_filter := now() - interval '30 days';
    WHEN '90d' THEN time_filter := now() - interval '90 days';
    ELSE time_filter := now() - interval '30 days';
  END CASE;

  -- Get session metrics including new/returning visitors (with zero division protection)
  SELECT jsonb_build_object(
    'total_sessions', COUNT(*),
    'unique_visitors', COUNT(DISTINCT anon_id),
    'new_visitors', COUNT(CASE WHEN is_returning_visitor = false THEN 1 END),
    'returning_visitors', COUNT(CASE WHEN is_returning_visitor = true THEN 1 END),
    'avg_session_duration_minutes', ROUND(COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at))/60), 0), 2),
    'bounce_rate_percent', CASE 
      WHEN COUNT(*) > 0 THEN ROUND((COUNT(CASE WHEN EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at)) < 10 THEN 1 END)::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0 
    END
  ) INTO session_metrics
  FROM public.funnel_sessions
  WHERE started_at >= time_filter;

  -- Get traffic sources breakdown (with safe division)
  WITH source_counts AS (
    SELECT 
      COALESCE(source_type, 'direct') as source_type,
      COUNT(*) as session_count
    FROM public.traffic_sources
    WHERE created_at >= time_filter
    GROUP BY source_type
  ),
  total_count AS (
    SELECT COALESCE(SUM(session_count), 0) as total_sessions FROM source_counts
  )
  SELECT jsonb_build_object(
    'by_source_type', COALESCE(jsonb_agg(
      jsonb_build_object(
        'source_type', sc.source_type,
        'sessions', sc.session_count,
        'percentage', CASE 
          WHEN tc.total_sessions > 0 THEN ROUND((sc.session_count::NUMERIC / tc.total_sessions) * 100, 1)
          ELSE 0 
        END
      )
    ), '[]'::jsonb),
    'top_referrers', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'domain', referrer_domain,
          'sessions', COUNT(*)
        ) ORDER BY COUNT(*) DESC
      )
      FROM public.traffic_sources
      WHERE created_at >= time_filter AND referrer_domain IS NOT NULL
      GROUP BY referrer_domain
      LIMIT 10
    ), '[]'::jsonb)
  ) INTO traffic_sources
  FROM source_counts sc
  CROSS JOIN total_count tc;

  -- Get device and browser breakdown (with safe division)
  WITH total_sessions AS (
    SELECT COALESCE(COUNT(*), 0) as total FROM public.funnel_sessions WHERE started_at >= time_filter
  )
  SELECT jsonb_build_object(
    'device_types', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'device_type', COALESCE(device_type, 'Unknown'),
          'sessions', COUNT(*),
          'percentage', CASE 
            WHEN ts.total > 0 THEN ROUND((COUNT(*)::NUMERIC / ts.total) * 100, 1)
            ELSE 0 
          END
        )
      )
      FROM public.funnel_sessions fs, total_sessions ts
      WHERE fs.started_at >= time_filter
      GROUP BY device_type, ts.total
    ), '[]'::jsonb),
    'browsers', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'browser', COALESCE(browser_name, 'Unknown'),
          'sessions', COUNT(*)
        ) ORDER BY COUNT(*) DESC
      )
      FROM public.funnel_sessions
      WHERE started_at >= time_filter
      GROUP BY browser_name
      LIMIT 5
    ), '[]'::jsonb),
    'operating_systems', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'os', COALESCE(os_name, 'Unknown'),
          'sessions', COUNT(*)
        ) ORDER BY COUNT(*) DESC
      )
      FROM public.funnel_sessions
      WHERE started_at >= time_filter
      GROUP BY os_name
      LIMIT 5
    ), '[]'::jsonb)
  ) INTO device_breakdown
  FROM total_sessions ts;

  -- Get geographic data (with safe division)
  WITH total_sessions AS (
    SELECT COALESCE(COUNT(*), 0) as total FROM public.funnel_sessions WHERE started_at >= time_filter
  )
  SELECT jsonb_build_object(
    'countries', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'country', COALESCE(country_code, 'Unknown'),
          'sessions', COUNT(*),
          'percentage', CASE 
            WHEN ts.total > 0 THEN ROUND((COUNT(*)::NUMERIC / ts.total) * 100, 1)
            ELSE 0 
          END
        ) ORDER BY COUNT(*) DESC
      )
      FROM public.funnel_sessions fs, total_sessions ts
      WHERE fs.started_at >= time_filter
      GROUP BY country_code, ts.total
      LIMIT 10
    ), '[]'::jsonb),
    'cities', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'city', city,
          'sessions', COUNT(*)
        ) ORDER BY COUNT(*) DESC
      )
      FROM public.funnel_sessions
      WHERE started_at >= time_filter AND city IS NOT NULL
      GROUP BY city
      LIMIT 10
    ), '[]'::jsonb)
  ) INTO geo_data
  FROM total_sessions ts;

  -- Get conversion data (with safe division)
  WITH session_total AS (
    SELECT COALESCE(COUNT(*), 0) as total FROM public.funnel_sessions WHERE started_at >= time_filter
  )
  SELECT jsonb_build_object(
    'total_conversions', COALESCE(COUNT(*), 0),
    'conversion_rate_percent', CASE 
      WHEN st.total > 0 THEN ROUND((COUNT(*)::NUMERIC / st.total) * 100, 2)
      ELSE 0 
    END,
    'by_event_type', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'event_type', event_type,
          'count', COUNT(*),
          'total_value', COALESCE(SUM(conversion_value), 0)
        )
      )
      FROM public.conversion_events
      WHERE created_at >= time_filter
      GROUP BY event_type
      ORDER BY COUNT(*) DESC
    ), '[]'::jsonb)
  ) INTO conversion_data
  FROM public.conversion_events ce
  CROSS JOIN session_total st
  WHERE ce.created_at >= time_filter;

  -- Get behavior metrics
  SELECT jsonb_build_object(
    'top_exit_pages', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'page_url', exit_page_url,
          'exits', COUNT(*),
          'avg_time_on_page', ROUND(COALESCE(AVG(time_on_page_seconds), 0), 0)
        ) ORDER BY COUNT(*) DESC
      )
      FROM public.exit_events
      WHERE created_at >= time_filter
      GROUP BY exit_page_url
      LIMIT 10
    ), '[]'::jsonb),
    'avg_scroll_depth', ROUND(COALESCE((
      SELECT AVG(scroll_depth_percentage)
      FROM public.scroll_depth_events
      WHERE created_at >= time_filter
    ), 0), 1)
  ) INTO behavior_metrics;

  -- Build comprehensive result with fallbacks
  result := jsonb_build_object(
    'period', p_period,
    'session_metrics', COALESCE(session_metrics, jsonb_build_object(
      'total_sessions', 0,
      'unique_visitors', 0,
      'new_visitors', 0,
      'returning_visitors', 0,
      'avg_session_duration_minutes', 0,
      'bounce_rate_percent', 0
    )),
    'traffic_sources', COALESCE(traffic_sources, jsonb_build_object(
      'by_source_type', '[]'::jsonb,
      'top_referrers', '[]'::jsonb
    )),
    'device_breakdown', COALESCE(device_breakdown, jsonb_build_object(
      'device_types', '[]'::jsonb,
      'browsers', '[]'::jsonb,
      'operating_systems', '[]'::jsonb
    )),
    'geographic_data', COALESCE(geo_data, jsonb_build_object(
      'countries', '[]'::jsonb,
      'cities', '[]'::jsonb
    )),
    'conversions', COALESCE(conversion_data, jsonb_build_object(
      'total_conversions', 0,
      'conversion_rate_percent', 0,
      'by_event_type', '[]'::jsonb
    )),
    'behavior_metrics', COALESCE(behavior_metrics, jsonb_build_object(
      'top_exit_pages', '[]'::jsonb,
      'avg_scroll_depth', 0
    )),
    'generated_at', now()
  );

  RETURN result;
END;
$$;