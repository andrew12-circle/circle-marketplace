
-- 1) Tables for funnel tracking

CREATE TABLE public.funnel_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id UUID NOT NULL,
  user_id UUID,                          -- do NOT FK to auth.users (as per guidance)
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  landing_page TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.funnel_sessions(id) ON DELETE CASCADE,
  anon_id UUID NOT NULL,
  user_id UUID,                          -- populated post-auth via link_funnel_events
  event_name TEXT NOT NULL,
  page_url TEXT,
  referrer_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) RLS

ALTER TABLE public.funnel_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authed) can insert sessions/events
CREATE POLICY "anyone_can_insert_sessions" ON public.funnel_sessions
FOR INSERT WITH CHECK (true);

CREATE POLICY "anyone_can_insert_events" ON public.funnel_events
FOR INSERT WITH CHECK (true);

-- Only admins can read sessions/events
CREATE POLICY "admins_can_select_sessions" ON public.funnel_sessions
FOR SELECT USING (get_user_admin_status());

CREATE POLICY "admins_can_select_events" ON public.funnel_events
FOR SELECT USING (get_user_admin_status());

-- Only admins can delete sessions/events (optional)
CREATE POLICY "admins_can_delete_sessions" ON public.funnel_sessions
FOR DELETE USING (get_user_admin_status());

CREATE POLICY "admins_can_delete_events" ON public.funnel_events
FOR DELETE USING (get_user_admin_status());

-- (No public UPDATE policies; updates are done via SECURITY DEFINER RPCs below)

-- 3) Triggers to maintain updated_at

CREATE TRIGGER funnel_sessions_set_updated_at
BEFORE UPDATE ON public.funnel_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Helpful indexes

CREATE INDEX idx_funnel_events_created_at ON public.funnel_events (created_at DESC);
CREATE INDEX idx_funnel_events_event_name ON public.funnel_events (event_name);
CREATE INDEX idx_funnel_events_user_id ON public.funnel_events (user_id);
CREATE INDEX idx_funnel_events_anon_id ON public.funnel_events (anon_id);
CREATE INDEX idx_funnel_events_session_id ON public.funnel_events (session_id);

CREATE INDEX idx_funnel_sessions_anon_id ON public.funnel_sessions (anon_id);
CREATE INDEX idx_funnel_sessions_user_id ON public.funnel_sessions (user_id);
CREATE INDEX idx_funnel_sessions_started_at ON public.funnel_sessions (started_at DESC);

-- 5) RPC to link anon events to the authenticated user
-- Binds all historical session/event rows with the given anon_id to the current auth.uid()

CREATE OR REPLACE FUNCTION public.link_funnel_events(p_anon_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  updated_sessions int := 0;
  updated_events int := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Must be authenticated to link events';
  END IF;

  UPDATE public.funnel_sessions
     SET user_id = v_user_id,
         updated_at = now()
   WHERE anon_id = p_anon_id
     AND user_id IS NULL;
  GET DIAGNOSTICS updated_sessions = ROW_COUNT;

  UPDATE public.funnel_events
     SET user_id = v_user_id
   WHERE anon_id = p_anon_id
     AND user_id IS NULL;
  GET DIAGNOSTICS updated_events = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'updated_sessions', updated_sessions,
    'updated_events', updated_events
  );
END;
$$;

-- 6) RPC to compute funnel metrics for a period (7d, 30d, 90d)

CREATE OR REPLACE FUNCTION public.get_funnel_metrics(p_period text DEFAULT '30d')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  time_filter timestamptz;
  is_admin boolean;
  v jsonb;
  -- Counts by distinct anon_id for each step to reduce noise
  c_view_pricing int := 0;
  c_cta_click int := 0;
  c_auth_start int := 0;
  c_auth_success int := 0;
  c_checkout_created int := 0;
  c_checkout_completed int := 0;
  c_sub_active int := 0;
BEGIN
  -- Admins only
  SELECT get_user_admin_status() INTO is_admin;
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admins only';
  END IF;

  CASE p_period
    WHEN '7d'  THEN time_filter := now() - interval '7 days';
    WHEN '30d' THEN time_filter := now() - interval '30 days';
    WHEN '90d' THEN time_filter := now() - interval '90 days';
    ELSE time_filter := now() - interval '30 days';
  END CASE;

  WITH ev AS (
    SELECT anon_id, event_name
    FROM public.funnel_events
    WHERE created_at >= time_filter
  )
  SELECT
    COUNT(DISTINCT CASE WHEN event_name = 'view_pricing' THEN anon_id END),
    COUNT(DISTINCT CASE WHEN event_name = 'cta_start_trial_click' THEN anon_id END),
    COUNT(DISTINCT CASE WHEN event_name = 'auth_signup_start' THEN anon_id END),
    COUNT(DISTINCT CASE WHEN event_name = 'auth_signup_success' THEN anon_id END),
    COUNT(DISTINCT CASE WHEN event_name = 'checkout_session_created' THEN anon_id END),
    COUNT(DISTINCT CASE WHEN event_name = 'checkout_completed' THEN anon_id END),
    COUNT(DISTINCT CASE WHEN event_name = 'subscription_active' THEN anon_id END)
  INTO c_view_pricing, c_cta_click, c_auth_start, c_auth_success, c_checkout_created, c_checkout_completed, c_sub_active
  FROM ev;

  v := jsonb_build_object(
    'period', p_period,
    'counts', jsonb_build_object(
      'view_pricing', c_view_pricing,
      'cta_start_trial_click', c_cta_click,
      'auth_signup_start', c_auth_start,
      'auth_signup_success', c_auth_success,
      'checkout_session_created', c_checkout_created,
      'checkout_completed', c_checkout_completed,
      'subscription_active', c_sub_active
    ),
    'conversion', jsonb_build_object(
      'pricing_to_cta_pct', CASE WHEN c_view_pricing > 0 THEN ROUND((c_cta_click::numeric / c_view_pricing::numeric)*100, 2) ELSE 0 END,
      'cta_to_auth_start_pct', CASE WHEN c_cta_click > 0 THEN ROUND((c_auth_start::numeric / c_cta_click::numeric)*100, 2) ELSE 0 END,
      'auth_start_to_success_pct', CASE WHEN c_auth_start > 0 THEN ROUND((c_auth_success::numeric / c_auth_start::numeric)*100, 2) ELSE 0 END,
      'auth_success_to_checkout_created_pct', CASE WHEN c_auth_success > 0 THEN ROUND((c_checkout_created::numeric / c_auth_success::numeric)*100, 2) ELSE 0 END,
      'checkout_created_to_completed_pct', CASE WHEN c_checkout_created > 0 THEN ROUND((c_checkout_completed::numeric / c_checkout_created::numeric)*100, 2) ELSE 0 END,
      'pricing_to_sub_active_pct', CASE WHEN c_view_pricing > 0 THEN ROUND((c_sub_active::numeric / c_view_pricing::numeric)*100, 2) ELSE 0 END
    ),
    'generated_at', now()
  );

  RETURN v;
END;
$$;
