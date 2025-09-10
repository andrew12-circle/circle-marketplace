-- Fix ambiguous column reference in get_web_analytics function
CREATE OR REPLACE FUNCTION public.get_web_analytics(p_period TEXT DEFAULT '30d')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  time_filter TIMESTAMPTZ;
  result JSONB;
  total_sessions INTEGER;
  unique_visitors INTEGER;
  avg_session_duration NUMERIC;
  avg_pages_per_session NUMERIC;
  bounce_rate NUMERIC;
  top_pages JSONB;
  top_clicks JSONB;
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

  -- Get session metrics
  SELECT 
    COUNT(*),
    COUNT(DISTINCT anon_id),
    AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at))/60),
    AVG(page_count.pages)
  INTO total_sessions, unique_visitors, avg_session_duration, avg_pages_per_session
  FROM public.funnel_sessions fs
  LEFT JOIN (
    SELECT session_id, COUNT(*) as pages
    FROM public.page_views
    WHERE entered_at >= time_filter
    GROUP BY session_id
  ) page_count ON fs.id = page_count.session_id
  WHERE fs.started_at >= time_filter;

  -- Calculate bounce rate (sessions with duration < 10 seconds or only 1 page)
  SELECT 
    ROUND((COUNT(*)::NUMERIC / NULLIF(total_sessions, 0)) * 100, 2)
  INTO bounce_rate
  FROM public.funnel_sessions fs
  LEFT JOIN (
    SELECT session_id, COUNT(*) as pages
    FROM public.page_views
    WHERE entered_at >= time_filter
    GROUP BY session_id
  ) page_count ON fs.id = page_count.session_id
  WHERE fs.started_at >= time_filter
    AND (
      EXTRACT(EPOCH FROM (COALESCE(fs.ended_at, now()) - fs.started_at)) < 10
      OR COALESCE(page_count.pages, 0) <= 1
    );

  -- Get top pages (fixed ambiguous column reference)
  SELECT jsonb_agg(
    jsonb_build_object(
      'page_url', t.page_url,
      'page_title', t.page_title,
      'views', t.views,
      'unique_visitors', t.unique_visitors,
      'avg_time_on_page', t.avg_time_on_page,
      'exit_rate', t.exit_rate
    ) ORDER BY t.views DESC
  )
  INTO top_pages
  FROM (
    SELECT 
      page_url,
      page_title,
      COUNT(*) as views,
      COUNT(DISTINCT anon_id) as unique_visitors,
      ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(exited_at, now()) - entered_at))/60), 2) as avg_time_on_page,
      ROUND((COUNT(CASE WHEN exited_at IS NULL THEN 1 END)::NUMERIC / COUNT(*)) * 100, 2) as exit_rate
    FROM public.page_views
    WHERE entered_at >= time_filter
    GROUP BY page_url, page_title
    ORDER BY views DESC
    LIMIT 10
  ) t;

  -- Get top click targets
  SELECT jsonb_agg(
    jsonb_build_object(
      'element_selector', t.element_selector,
      'element_text', t.element_text,
      'clicks', t.clicks,
      'unique_clickers', t.unique_clickers,
      'pages_clicked', t.pages_clicked
    ) ORDER BY t.clicks DESC
  )
  INTO top_clicks
  FROM (
    SELECT 
      element_selector,
      element_text,
      COUNT(*) as clicks,
      COUNT(DISTINCT anon_id) as unique_clickers,
      COUNT(DISTINCT page_url) as pages_clicked
    FROM public.click_events
    WHERE created_at >= time_filter
      AND element_selector IS NOT NULL
    GROUP BY element_selector, element_text
    ORDER BY clicks DESC
    LIMIT 15
  ) t;

  -- Build result
  result := jsonb_build_object(
    'period', p_period,
    'metrics', jsonb_build_object(
      'total_sessions', COALESCE(total_sessions, 0),
      'unique_visitors', COALESCE(unique_visitors, 0),
      'avg_session_duration_minutes', ROUND(COALESCE(avg_session_duration, 0), 2),
      'avg_pages_per_session', ROUND(COALESCE(avg_pages_per_session, 0), 2),
      'bounce_rate_percent', COALESCE(bounce_rate, 0)
    ),
    'top_pages', COALESCE(top_pages, '[]'::jsonb),
    'top_clicks', COALESCE(top_clicks, '[]'::jsonb),
    'generated_at', now()
  );

  RETURN result;
END;
$$;