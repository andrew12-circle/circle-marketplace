-- Enable PostGIS extension for geographic data types
CREATE EXTENSION IF NOT EXISTS postgis;

-- Lender Marketplace Core Schema
-- Create custom types
CREATE TYPE lender_org_type AS ENUM ('lender', 'title', 'insurance', 'other');
CREATE TYPE lender_user_role AS ENUM ('admin', 'approver', 'analyst', 'lo', 'billing', 'api');
CREATE TYPE lender_geo_scope AS ENUM ('national', 'state', 'msa', 'zip');
CREATE TYPE lender_tie_breaker AS ENUM ('distance', 'reviews', 'alpha');
CREATE TYPE lender_request_status AS ENUM ('draft', 'searching', 'awaiting_vendor', 'countered', 'approved', 'declined', 'expired', 'canceled', 'fulfilled');
CREATE TYPE lender_decision_type AS ENUM ('pending', 'approved', 'counter', 'declined', 'auto_expired');
CREATE TYPE lender_actor_type AS ENUM ('agent', 'vendor', 'system');
CREATE TYPE lender_channel_type AS ENUM ('email', 'sms', 'push', 'webhook', 'voice');
CREATE TYPE lender_notif_status AS ENUM ('pending', 'sent', 'failed', 'ack');
CREATE TYPE lender_recurrency AS ENUM ('one_time', 'monthly');
CREATE TYPE lender_commitment_status AS ENUM ('pending', 'active', 'canceled', 'completed');

-- Vendor organization table
CREATE TABLE public.lender_vendor_org (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type lender_org_type NOT NULL,
  nationwide BOOLEAN DEFAULT false,
  support_email TEXT,
  support_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vendor users - maps auth users to vendor orgs
CREATE TABLE public.lender_vendor_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_org_id UUID NOT NULL REFERENCES public.lender_vendor_org(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role lender_user_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_org_id, user_id)
);

-- Vendor matching rules
CREATE TABLE public.lender_vendor_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_org_id UUID NOT NULL REFERENCES public.lender_vendor_org(id) ON DELETE CASCADE,
  min_buyers_12mo INTEGER DEFAULT 0,
  min_units_12mo INTEGER DEFAULT 0,
  geo_scope lender_geo_scope DEFAULT 'national',
  states TEXT[],
  msas TEXT[],
  zips TEXT[],
  product_categories TEXT[],
  max_monthly_budget NUMERIC,
  max_per_agent_commit NUMERIC,
  allow_counter_offer BOOLEAN DEFAULT true,
  auto_approve_threshold NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_org_id)
);

-- Vendor roster - LOs and their territories
CREATE TABLE public.lender_vendor_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_org_id UUID NOT NULL REFERENCES public.lender_vendor_org(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  geo_point GEOGRAPHY(POINT, 4326),
  states TEXT[],
  msas TEXT[],
  zips TEXT[],
  is_active BOOLEAN DEFAULT true,
  review_count INTEGER DEFAULT 0,
  review_avg NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vendor priorities for tie-breaking
CREATE TABLE public.lender_vendor_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_org_id UUID NOT NULL REFERENCES public.lender_vendor_org(id) ON DELETE CASCADE,
  tie_breaker lender_tie_breaker DEFAULT 'distance',
  distance_km INTEGER DEFAULT 150,
  UNIQUE(vendor_org_id)
);

-- Agent requests for lender services
CREATE TABLE public.lender_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  sku_id UUID NOT NULL,
  requested_vendor_share NUMERIC,
  agent_latlon GEOGRAPHY(POINT, 4326),
  status lender_request_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Snapshot of agent data at time of request
CREATE TABLE public.lender_request_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.lender_request(id) ON DELETE CASCADE,
  agent_stats_json JSONB,
  goals_json JSONB,
  geo_json JSONB,
  UNIQUE(request_id)
);

-- Match candidates for each request
CREATE TABLE public.lender_match_candidate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.lender_request(id) ON DELETE CASCADE,
  vendor_org_id UUID NOT NULL REFERENCES public.lender_vendor_org(id) ON DELETE CASCADE,
  eligibility TEXT CHECK (eligibility IN ('eligible', 'ineligible')),
  ineligible_reason TEXT,
  rank_score NUMERIC,
  UNIQUE(request_id, vendor_org_id)
);

-- Routing decisions to specific LOs
CREATE TABLE public.lender_match_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.lender_request(id) ON DELETE CASCADE,
  vendor_org_id UUID NOT NULL REFERENCES public.lender_vendor_org(id) ON DELETE CASCADE,
  lo_id UUID NOT NULL REFERENCES public.lender_vendor_roster(id) ON DELETE CASCADE,
  routing_reason TEXT,
  distance_km NUMERIC,
  UNIQUE(request_id, vendor_org_id)
);

-- Vendor decisions on requests
CREATE TABLE public.lender_vendor_decision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.lender_request(id) ON DELETE CASCADE,
  vendor_org_id UUID NOT NULL REFERENCES public.lender_vendor_org(id) ON DELETE CASCADE,
  proposed_share NUMERIC,
  decision lender_decision_type DEFAULT 'pending',
  decision_reason TEXT,
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  UNIQUE(request_id, vendor_org_id)
);

-- Notification events
CREATE TABLE public.lender_notif_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.lender_request(id) ON DELETE CASCADE,
  vendor_org_id UUID REFERENCES public.lender_vendor_org(id) ON DELETE CASCADE,
  lo_id UUID REFERENCES public.lender_vendor_roster(id) ON DELETE CASCADE,
  channel lender_channel_type,
  status lender_notif_status DEFAULT 'pending',
  payload JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logging
CREATE TABLE public.lender_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor lender_actor_type,
  actor_id UUID,
  action TEXT,
  entity TEXT,
  entity_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Commitments/contracts
CREATE TABLE public.lender_commitment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.lender_request(id) ON DELETE CASCADE,
  vendor_org_id UUID NOT NULL REFERENCES public.lender_vendor_org(id) ON DELETE CASCADE,
  share NUMERIC,
  agent_share NUMERIC,
  recurrency lender_recurrency DEFAULT 'monthly',
  start_date DATE,
  end_date DATE,
  status lender_commitment_status DEFAULT 'pending'
);

-- Create indexes for performance
CREATE INDEX idx_lender_vendor_user_org_id ON public.lender_vendor_user(vendor_org_id);
CREATE INDEX idx_lender_vendor_user_user_id ON public.lender_vendor_user(user_id);
CREATE INDEX idx_lender_vendor_rule_org_id ON public.lender_vendor_rule(vendor_org_id);
CREATE INDEX idx_lender_vendor_roster_org_id ON public.lender_vendor_roster(vendor_org_id);
CREATE INDEX idx_lender_vendor_roster_geo ON public.lender_vendor_roster USING GIST(geo_point);
CREATE INDEX idx_lender_vendor_roster_reviews ON public.lender_vendor_roster(review_avg DESC, review_count DESC);
CREATE INDEX idx_lender_request_status ON public.lender_request(status);
CREATE INDEX idx_lender_request_agent ON public.lender_request(agent_id);
CREATE INDEX idx_lender_match_candidate_request ON public.lender_match_candidate(request_id, vendor_org_id);
CREATE INDEX idx_lender_match_routing_request ON public.lender_match_routing(request_id);
CREATE INDEX idx_lender_vendor_decision_request ON public.lender_vendor_decision(request_id);
CREATE INDEX idx_lender_notif_event_status ON public.lender_notif_event(status);
CREATE INDEX idx_lender_notif_event_created ON public.lender_notif_event(created_at);

-- Enable RLS on all tables
ALTER TABLE public.lender_vendor_org ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_vendor_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_vendor_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_vendor_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_vendor_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_request_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_match_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_match_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_vendor_decision ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_notif_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_commitment ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's vendor org ID
CREATE OR REPLACE FUNCTION public.get_user_vendor_org_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = PUBLIC
AS $$
  SELECT vendor_org_id FROM public.lender_vendor_user 
  WHERE user_id = auth.uid() AND is_active = true 
  LIMIT 1;
$$;

-- Helper function to check if user is vendor admin/approver
CREATE OR REPLACE FUNCTION public.is_vendor_admin_or_approver()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = PUBLIC
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lender_vendor_user 
    WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role IN ('admin', 'approver')
  );
$$;

-- RLS Policies (simplified for initial implementation)
CREATE POLICY "Service role full access vendor_org" ON public.lender_vendor_org FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access vendor_user" ON public.lender_vendor_user FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access vendor_rule" ON public.lender_vendor_rule FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access vendor_roster" ON public.lender_vendor_roster FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access vendor_priorities" ON public.lender_vendor_priorities FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access request" ON public.lender_request FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access request_snapshot" ON public.lender_request_snapshot FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access match_candidate" ON public.lender_match_candidate FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access match_routing" ON public.lender_match_routing FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access vendor_decision" ON public.lender_vendor_decision FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access notif_event" ON public.lender_notif_event FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access audit_log" ON public.lender_audit_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access commitment" ON public.lender_commitment FOR ALL USING (auth.role() = 'service_role');