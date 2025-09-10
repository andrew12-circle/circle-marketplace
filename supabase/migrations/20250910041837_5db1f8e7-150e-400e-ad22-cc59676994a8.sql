-- Create web analytics tables
CREATE TABLE IF NOT EXISTS public.web_analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_id UUID NOT NULL,
    user_id UUID,
    is_new_visitor BOOLEAN DEFAULT true,
    device_type TEXT,
    browser_name TEXT,
    browser_version TEXT,
    operating_system TEXT,
    country TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.web_analytics_page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.web_analytics_sessions(id) ON DELETE CASCADE,
    page_url TEXT NOT NULL,
    page_title TEXT,
    is_exit BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.web_analytics_traffic_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.web_analytics_sessions(id) ON DELETE CASCADE,
    source_type TEXT, -- direct, referral, search, social, email, utm
    referrer_domain TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.web_analytics_click_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.web_analytics_sessions(id) ON DELETE CASCADE,
    page_view_id UUID REFERENCES public.web_analytics_page_views(id) ON DELETE CASCADE,
    element_selector TEXT,
    element_text TEXT,
    click_x INTEGER,
    click_y INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.web_analytics_scroll_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.web_analytics_sessions(id) ON DELETE CASCADE,
    page_view_id UUID REFERENCES public.web_analytics_page_views(id) ON DELETE CASCADE,
    scroll_depth INTEGER, -- percentage 0-100
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.web_analytics_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.web_analytics_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- signup, purchase, download, etc.
    event_name TEXT NOT NULL,
    value NUMERIC DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_web_analytics_sessions_created_at ON public.web_analytics_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_web_analytics_sessions_anonymous_id ON public.web_analytics_sessions(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_web_analytics_page_views_session_id ON public.web_analytics_page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_web_analytics_page_views_created_at ON public.web_analytics_page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_web_analytics_traffic_sources_session_id ON public.web_analytics_traffic_sources(session_id);
CREATE INDEX IF NOT EXISTS idx_web_analytics_click_events_session_id ON public.web_analytics_click_events(session_id);
CREATE INDEX IF NOT EXISTS idx_web_analytics_scroll_events_session_id ON public.web_analytics_scroll_events(session_id);
CREATE INDEX IF NOT EXISTS idx_web_analytics_conversions_session_id ON public.web_analytics_conversions(session_id);
CREATE INDEX IF NOT EXISTS idx_web_analytics_conversions_created_at ON public.web_analytics_conversions(created_at);

-- Enable RLS on all tables
ALTER TABLE public.web_analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_analytics_traffic_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_analytics_click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_analytics_scroll_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_analytics_conversions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin access for analytics dashboard)
CREATE POLICY "Allow admin access to web analytics sessions" ON public.web_analytics_sessions
    FOR ALL USING (get_user_admin_status() = true);

CREATE POLICY "Allow admin access to web analytics page views" ON public.web_analytics_page_views
    FOR ALL USING (get_user_admin_status() = true);

CREATE POLICY "Allow admin access to web analytics traffic sources" ON public.web_analytics_traffic_sources
    FOR ALL USING (get_user_admin_status() = true);

CREATE POLICY "Allow admin access to web analytics click events" ON public.web_analytics_click_events
    FOR ALL USING (get_user_admin_status() = true);

CREATE POLICY "Allow admin access to web analytics scroll events" ON public.web_analytics_scroll_events
    FOR ALL USING (get_user_admin_status() = true);

CREATE POLICY "Allow admin access to web analytics conversions" ON public.web_analytics_conversions
    FOR ALL USING (get_user_admin_status() = true);

-- Allow anonymous insert for tracking (tracking happens before auth)
CREATE POLICY "Allow anonymous insert for sessions" ON public.web_analytics_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert for page views" ON public.web_analytics_page_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert for traffic sources" ON public.web_analytics_traffic_sources
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert for click events" ON public.web_analytics_click_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert for scroll events" ON public.web_analytics_scroll_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert for conversions" ON public.web_analytics_conversions
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own session data
CREATE POLICY "Allow session updates by anonymous_id" ON public.web_analytics_sessions
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow page view updates by session" ON public.web_analytics_page_views
    FOR UPDATE USING (true) WITH CHECK (true);