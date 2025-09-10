-- Add enhanced tracking fields to existing tables for comprehensive analytics

-- Add device and location tracking to funnel_sessions
ALTER TABLE public.funnel_sessions 
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS referrer_url text,
ADD COLUMN IF NOT EXISTS browser_name text,
ADD COLUMN IF NOT EXISTS browser_version text,
ADD COLUMN IF NOT EXISTS os_name text,
ADD COLUMN IF NOT EXISTS device_type text,
ADD COLUMN IF NOT EXISTS screen_resolution text,
ADD COLUMN IF NOT EXISTS viewport_size text,
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS country_code text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS is_returning_visitor boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS session_metadata jsonb DEFAULT '{}';

-- Create conversion events table for tracking business outcomes
CREATE TABLE IF NOT EXISTS public.conversion_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.funnel_sessions(id) ON DELETE CASCADE,
  anon_id uuid NOT NULL,
  user_id uuid,
  event_type text NOT NULL, -- 'form_submit', 'signup', 'consultation_booking', 'purchase', etc.
  event_name text NOT NULL,
  page_url text NOT NULL,
  conversion_value numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create traffic sources table for detailed source attribution
CREATE TABLE IF NOT EXISTS public.traffic_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.funnel_sessions(id) ON DELETE CASCADE,
  anon_id uuid NOT NULL,
  source_type text NOT NULL, -- 'direct', 'search', 'social', 'referral', 'email', 'paid'
  source_name text, -- 'google', 'facebook', 'linkedin', etc.
  campaign_name text,
  medium text,
  content text,
  term text,
  referrer_domain text,
  referrer_path text,
  landing_page text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create scroll depth tracking table
CREATE TABLE IF NOT EXISTS public.scroll_depth_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.funnel_sessions(id) ON DELETE CASCADE,
  anon_id uuid NOT NULL,
  user_id uuid,
  page_url text NOT NULL,
  page_title text,
  scroll_depth_percentage integer NOT NULL,
  time_to_depth_seconds integer,
  viewport_height integer,
  page_height integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create exit tracking table
CREATE TABLE IF NOT EXISTS public.exit_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.funnel_sessions(id) ON DELETE CASCADE,
  anon_id uuid NOT NULL,
  user_id uuid,
  exit_page_url text NOT NULL,
  exit_page_title text,
  time_on_page_seconds integer,
  scroll_depth_percentage integer,
  exit_type text, -- 'browser_close', 'navigation', 'timeout'
  destination_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversion_events_session_id ON public.conversion_events(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_type ON public.conversion_events(event_type);
CREATE INDEX IF NOT EXISTS idx_conversion_events_created_at ON public.conversion_events(created_at);

CREATE INDEX IF NOT EXISTS idx_traffic_sources_session_id ON public.traffic_sources(session_id);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_type ON public.traffic_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_created_at ON public.traffic_sources(created_at);

CREATE INDEX IF NOT EXISTS idx_scroll_depth_session_id ON public.scroll_depth_events(session_id);
CREATE INDEX IF NOT EXISTS idx_scroll_depth_page_url ON public.scroll_depth_events(page_url);
CREATE INDEX IF NOT EXISTS idx_scroll_depth_created_at ON public.scroll_depth_events(created_at);

CREATE INDEX IF NOT EXISTS idx_exit_events_session_id ON public.exit_events(session_id);
CREATE INDEX IF NOT EXISTS idx_exit_events_page_url ON public.exit_events(exit_page_url);
CREATE INDEX IF NOT EXISTS idx_exit_events_created_at ON public.exit_events(created_at);

CREATE INDEX IF NOT EXISTS idx_funnel_sessions_device_type ON public.funnel_sessions(device_type);
CREATE INDEX IF NOT EXISTS idx_funnel_sessions_country_code ON public.funnel_sessions(country_code);
CREATE INDEX IF NOT EXISTS idx_funnel_sessions_returning ON public.funnel_sessions(is_returning_visitor);

-- RLS Policies for new tables
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scroll_depth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_events ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all analytics data
CREATE POLICY "Admins can view all conversion events" ON public.conversion_events
  FOR SELECT USING (get_user_admin_status());

CREATE POLICY "Admins can view all traffic sources" ON public.traffic_sources
  FOR SELECT USING (get_user_admin_status());

CREATE POLICY "Admins can view all scroll depth events" ON public.scroll_depth_events
  FOR SELECT USING (get_user_admin_status());

CREATE POLICY "Admins can view all exit events" ON public.exit_events
  FOR SELECT USING (get_user_admin_status());

-- Allow system to insert tracking data
CREATE POLICY "System can insert conversion events" ON public.conversion_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert traffic sources" ON public.traffic_sources
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert scroll depth events" ON public.scroll_depth_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert exit events" ON public.exit_events
  FOR INSERT WITH CHECK (true);

-- Update the web analytics function to include comprehensive metrics
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

  -- Get session metrics including new/returning visitors
  SELECT jsonb_build_object(
    'total_sessions', COUNT(*),
    'unique_visitors', COUNT(DISTINCT anon_id),
    'new_visitors', COUNT(CASE WHEN is_returning_visitor = false THEN 1 END),
    'returning_visitors', COUNT(CASE WHEN is_returning_visitor = true THEN 1 END),
    'avg_session_duration_minutes', ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at))/60), 2),
    'bounce_rate_percent', ROUND((COUNT(CASE WHEN EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at)) < 10 THEN 1 END)::NUMERIC / COUNT(*)) * 100, 2)
  ) INTO session_metrics
  FROM public.funnel_sessions
  WHERE started_at >= time_filter;

  -- Get traffic sources breakdown
  SELECT jsonb_build_object(
    'by_source_type', jsonb_agg(
      jsonb_build_object(
        'source_type', source_type,
        'sessions', session_count,
        'percentage', ROUND((session_count::NUMERIC / total_sessions) * 100, 1)
      )
    ),
    'top_referrers', top_ref
  ) INTO traffic_sources
  FROM (
    SELECT 
      source_type,
      COUNT(*) as session_count,
      (SELECT COUNT(*) FROM public.traffic_sources WHERE created_at >= time_filter) as total_sessions
    FROM public.traffic_sources
    WHERE created_at >= time_filter
    GROUP BY source_type
    ORDER BY session_count DESC
  ) t1
  CROSS JOIN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'domain', referrer_domain,
        'sessions', COUNT(*)
      ) ORDER BY COUNT(*) DESC
    ) as top_ref
    FROM public.traffic_sources
    WHERE created_at >= time_filter AND referrer_domain IS NOT NULL
    GROUP BY referrer_domain
    LIMIT 10
  ) t2;

  -- Get device and browser breakdown
  SELECT jsonb_build_object(
    'device_types', device_stats,
    'browsers', browser_stats,
    'operating_systems', os_stats
  ) INTO device_breakdown
  FROM (
    SELECT jsonb_agg(
      jsonb_build_object(
        'device_type', COALESCE(device_type, 'Unknown'),
        'sessions', COUNT(*),
        'percentage', ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM public.funnel_sessions WHERE started_at >= time_filter)) * 100, 1)
      )
    ) as device_stats
    FROM public.funnel_sessions
    WHERE started_at >= time_filter
    GROUP BY device_type
  ) d
  CROSS JOIN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'browser', COALESCE(browser_name, 'Unknown'),
        'sessions', COUNT(*)
      ) ORDER BY COUNT(*) DESC
    ) as browser_stats
    FROM public.funnel_sessions
    WHERE started_at >= time_filter
    GROUP BY browser_name
    LIMIT 5
  ) b
  CROSS JOIN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'os', COALESCE(os_name, 'Unknown'),
        'sessions', COUNT(*)
      ) ORDER BY COUNT(*) DESC
    ) as os_stats
    FROM public.funnel_sessions
    WHERE started_at >= time_filter
    GROUP BY os_name
    LIMIT 5
  ) o;

  -- Get geographic data
  SELECT jsonb_build_object(
    'countries', country_stats,
    'cities', city_stats
  ) INTO geo_data
  FROM (
    SELECT jsonb_agg(
      jsonb_build_object(
        'country', COALESCE(country_code, 'Unknown'),
        'sessions', COUNT(*),
        'percentage', ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM public.funnel_sessions WHERE started_at >= time_filter)) * 100, 1)
      ) ORDER BY COUNT(*) DESC
    ) as country_stats
    FROM public.funnel_sessions
    WHERE started_at >= time_filter
    GROUP BY country_code
    LIMIT 10
  ) c
  CROSS JOIN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'city', COALESCE(city, 'Unknown'),
        'sessions', COUNT(*)
      ) ORDER BY COUNT(*) DESC
    ) as city_stats
    FROM public.funnel_sessions
    WHERE started_at >= time_filter AND city IS NOT NULL
    GROUP BY city
    LIMIT 10
  ) ct;

  -- Get conversion data
  SELECT jsonb_build_object(
    'total_conversions', COUNT(*),
    'conversion_rate_percent', ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM public.funnel_sessions WHERE started_at >= time_filter)) * 100, 2),
    'by_event_type', jsonb_agg(
      jsonb_build_object(
        'event_type', event_type,
        'count', event_count,
        'total_value', total_value
      )
    )
  ) INTO conversion_data
  FROM (
    SELECT 
      event_type,
      COUNT(*) as event_count,
      SUM(conversion_value) as total_value
    FROM public.conversion_events
    WHERE created_at >= time_filter
    GROUP BY event_type
    ORDER BY event_count DESC
  ) conv;

  -- Get behavior metrics (exit pages, top content)
  SELECT jsonb_build_object(
    'top_exit_pages', exit_pages,
    'avg_scroll_depth', avg_scroll
  ) INTO behavior_metrics
  FROM (
    SELECT jsonb_agg(
      jsonb_build_object(
        'page_url', exit_page_url,
        'exits', COUNT(*),
        'avg_time_on_page', ROUND(AVG(time_on_page_seconds), 0)
      ) ORDER BY COUNT(*) DESC
    ) as exit_pages
    FROM public.exit_events
    WHERE created_at >= time_filter
    GROUP BY exit_page_url
    LIMIT 10
  ) e
  CROSS JOIN (
    SELECT ROUND(AVG(scroll_depth_percentage), 1) as avg_scroll
    FROM public.scroll_depth_events
    WHERE created_at >= time_filter
  ) s;

  -- Build comprehensive result
  result := jsonb_build_object(
    'period', p_period,
    'session_metrics', COALESCE(session_metrics, '{}'),
    'traffic_sources', COALESCE(traffic_sources, '{}'),
    'device_breakdown', COALESCE(device_breakdown, '{}'),
    'geographic_data', COALESCE(geo_data, '{}'),
    'conversions', COALESCE(conversion_data, '{}'),
    'behavior_metrics', COALESCE(behavior_metrics, '{}'),
    'generated_at', now()
  );

  RETURN result;
END;
$$;