-- Extend funnel_sessions table for session duration tracking
ALTER TABLE public.funnel_sessions 
ADD COLUMN ended_at TIMESTAMPTZ,
ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT now();

-- Create page_views table for detailed page analytics
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  anon_id UUID NOT NULL,
  user_id UUID,
  page_url TEXT NOT NULL,
  page_title TEXT,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exited_at TIMESTAMPTZ,
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create click_events table for interaction tracking
CREATE TABLE public.click_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  anon_id UUID NOT NULL,
  user_id UUID,
  page_url TEXT NOT NULL,
  element_selector TEXT,
  element_text TEXT,
  click_x INTEGER,
  click_y INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX idx_page_views_anon_id ON public.page_views(anon_id);
CREATE INDEX idx_page_views_page_url ON public.page_views(page_url);
CREATE INDEX idx_page_views_entered_at ON public.page_views(entered_at);
CREATE INDEX idx_page_views_user_id ON public.page_views(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX idx_click_events_session_id ON public.click_events(session_id);
CREATE INDEX idx_click_events_anon_id ON public.click_events(anon_id);
CREATE INDEX idx_click_events_page_url ON public.click_events(page_url);
CREATE INDEX idx_click_events_created_at ON public.click_events(created_at);
CREATE INDEX idx_click_events_user_id ON public.click_events(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX idx_funnel_sessions_ended_at ON public.funnel_sessions(ended_at) WHERE ended_at IS NOT NULL;
CREATE INDEX idx_funnel_sessions_last_activity ON public.funnel_sessions(last_activity_at);

-- Enable RLS on new tables
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for page_views
CREATE POLICY "Anyone can insert page views" ON public.page_views
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own page views" ON public.page_views
FOR SELECT USING (
  user_id = auth.uid() OR 
  (user_id IS NULL AND auth.uid() IS NULL)
);

CREATE POLICY "Admins can view all page views" ON public.page_views
FOR ALL USING (get_user_admin_status());

-- RLS policies for click_events
CREATE POLICY "Anyone can insert click events" ON public.click_events
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own click events" ON public.click_events
FOR SELECT USING (
  user_id = auth.uid() OR 
  (user_id IS NULL AND auth.uid() IS NULL)
);

CREATE POLICY "Admins can view all click events" ON public.click_events
FOR ALL USING (get_user_admin_status());

-- Function to end a session
CREATE OR REPLACE FUNCTION public.end_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.funnel_sessions 
  SET ended_at = now(), 
      last_activity_at = now()
  WHERE id = p_session_id 
    AND ended_at IS NULL;
END;
$$;

-- Function to touch session activity
CREATE OR REPLACE FUNCTION public.touch_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.funnel_sessions 
  SET last_activity_at = now()
  WHERE id = p_session_id 
    AND ended_at IS NULL;
END;
$$;

-- Function to get comprehensive web analytics
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

  -- Get top pages
  SELECT jsonb_agg(
    jsonb_build_object(
      'page_url', page_url,
      'page_title', page_title,
      'views', views,
      'unique_visitors', unique_visitors,
      'avg_time_on_page', avg_time_on_page,
      'exit_rate', exit_rate
    ) ORDER BY views DESC
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
      'element_selector', element_selector,
      'element_text', element_text,
      'clicks', clicks,
      'unique_clickers', unique_clickers,
      'pages_clicked', pages_clicked
    ) ORDER BY clicks DESC
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