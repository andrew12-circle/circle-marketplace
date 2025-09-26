-- Create enums for the lender marketplace system
CREATE TYPE public.request_status AS ENUM (
  'searching',
  'awaiting_vendor', 
  'approved',
  'countered',
  'declined',
  'expired',
  'cancelled'
);

CREATE TYPE public.decision_type AS ENUM (
  'approve',
  'counter', 
  'decline'
);

CREATE TYPE public.rule_type AS ENUM (
  'min_buyers_12m',
  'min_listings_12m',
  'min_closings_12m',
  'max_budget',
  'geo_scope',
  'auto_approve_threshold'
);

-- 1. VENDOR_RULE table for eligibility and budget rules
CREATE TABLE public.vendor_rule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  rule_type rule_type NOT NULL,
  rule_value JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, rule_type)
);

-- 2. REQUEST table as the canonical state machine
CREATE TABLE public.request (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  service_id UUID,
  loan_amount NUMERIC,
  property_address TEXT,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  loan_type TEXT,
  urgency_level TEXT DEFAULT 'normal',
  status request_status NOT NULL DEFAULT 'searching',
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. VENDOR_ROSTER table with LO geo points and routing
CREATE TABLE public.vendor_roster (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  lo_name TEXT NOT NULL,
  lo_email TEXT NOT NULL,
  lo_phone TEXT,
  lo_nmls_id TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  service_radius_miles INTEGER DEFAULT 50,
  review_score DECIMAL(3,2) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  specialties TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. MATCH_CANDIDATE table for eligibility and ranking
CREATE TABLE public.match_candidate (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.request(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL,
  roster_id UUID REFERENCES public.vendor_roster(id),
  eligibility_score INTEGER NOT NULL DEFAULT 0,
  distance_miles DECIMAL(6,2),
  review_score DECIMAL(3,2),
  final_rank INTEGER NOT NULL,
  eligibility_reasons JSONB DEFAULT '{}',
  disqualified BOOLEAN DEFAULT false,
  disqualification_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. MATCH_ROUTING table for routing decisions and tie-breakers
CREATE TABLE public.match_routing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.request(id) ON DELETE CASCADE,
  selected_candidate_id UUID REFERENCES public.match_candidate(id),
  routing_algorithm TEXT NOT NULL DEFAULT 'distance_reviews_alpha',
  tie_breaker_applied TEXT,
  routing_reasons JSONB DEFAULT '{}',
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. VENDOR_DECISION table for approve/counter/decline responses
CREATE TABLE public.vendor_decision (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.request(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL,
  roster_id UUID REFERENCES public.vendor_roster(id),
  decision_type decision_type NOT NULL,
  counter_offer_amount NUMERIC,
  counter_terms JSONB,
  decision_notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  decided_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  decided_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_vendor_rule_vendor_id ON public.vendor_rule(vendor_id);
CREATE INDEX idx_vendor_rule_active ON public.vendor_rule(is_active) WHERE is_active = true;

CREATE INDEX idx_request_status ON public.request(status);
CREATE INDEX idx_request_agent_id ON public.request(agent_id);
CREATE INDEX idx_request_expires_at ON public.request(expires_at);
CREATE INDEX idx_request_created_at ON public.request(created_at);

CREATE INDEX idx_vendor_roster_vendor_id ON public.vendor_roster(vendor_id);
CREATE INDEX idx_vendor_roster_active ON public.vendor_roster(is_active) WHERE is_active = true;
CREATE INDEX idx_vendor_roster_location ON public.vendor_roster(latitude, longitude);

CREATE INDEX idx_match_candidate_request_id ON public.match_candidate(request_id);
CREATE INDEX idx_match_candidate_rank ON public.match_candidate(final_rank);
CREATE INDEX idx_match_candidate_eligible ON public.match_candidate(disqualified) WHERE disqualified = false;

CREATE INDEX idx_match_routing_request_id ON public.match_routing(request_id);

CREATE INDEX idx_vendor_decision_request_id ON public.vendor_decision(request_id);
CREATE INDEX idx_vendor_decision_vendor_id ON public.vendor_decision(vendor_id);
CREATE INDEX idx_vendor_decision_expires_at ON public.vendor_decision(expires_at);

-- Enable RLS on all tables
ALTER TABLE public.vendor_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.vendor_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_decision ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_rule
CREATE POLICY "Admins can manage vendor rules" ON public.vendor_rule
  FOR ALL USING (get_user_admin_status());

CREATE POLICY "Vendors can view their own rules" ON public.vendor_rule
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own rules" ON public.vendor_rule
  FOR UPDATE USING (auth.uid() = vendor_id);

-- RLS Policies for request
CREATE POLICY "Admins can view all requests" ON public.request
  FOR SELECT USING (get_user_admin_status());

CREATE POLICY "Agents can manage their own requests" ON public.request
  FOR ALL USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "System can update request status" ON public.request
  FOR UPDATE USING (true);

-- RLS Policies for vendor_roster
CREATE POLICY "Admins can manage vendor roster" ON public.vendor_roster
  FOR ALL USING (get_user_admin_status());

CREATE POLICY "Vendors can manage their own roster" ON public.vendor_roster
  FOR ALL USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Active roster entries are viewable" ON public.vendor_roster
  FOR SELECT USING (is_active = true);

-- RLS Policies for match_candidate
CREATE POLICY "Admins can view all match candidates" ON public.match_candidate
  FOR SELECT USING (get_user_admin_status());

CREATE POLICY "System can manage match candidates" ON public.match_candidate
  FOR ALL USING (true);

-- RLS Policies for match_routing  
CREATE POLICY "Admins can view match routing" ON public.match_routing
  FOR SELECT USING (get_user_admin_status());

CREATE POLICY "System can manage match routing" ON public.match_routing
  FOR ALL USING (true);

-- RLS Policies for vendor_decision
CREATE POLICY "Admins can view all vendor decisions" ON public.vendor_decision
  FOR SELECT USING (get_user_admin_status());

CREATE POLICY "Vendors can manage their own decisions" ON public.vendor_decision
  FOR ALL USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Agents can view decisions for their requests" ON public.vendor_decision
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.request r 
      WHERE r.id = vendor_decision.request_id 
      AND r.agent_id = auth.uid()
    )
  );

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;   
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendor_rule_updated_at 
    BEFORE UPDATE ON public.vendor_rule 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_request_updated_at 
    BEFORE UPDATE ON public.request 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_roster_updated_at 
    BEFORE UPDATE ON public.vendor_roster 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();