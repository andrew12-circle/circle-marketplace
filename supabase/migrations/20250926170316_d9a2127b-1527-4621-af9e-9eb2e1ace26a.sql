-- Create enums for the lender marketplace system (with IF NOT EXISTS handling)
DO $$ BEGIN
    CREATE TYPE public.request_status AS ENUM (
      'searching',
      'awaiting_vendor', 
      'approved',
      'countered',
      'declined',
      'expired',
      'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.decision_type AS ENUM (
      'approve',
      'counter', 
      'decline'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.rule_type AS ENUM (
      'min_buyers_12m',
      'min_listings_12m',
      'min_closings_12m',
      'max_budget',
      'geo_scope',
      'auto_approve_threshold'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. VENDOR_RULE table for eligibility and budget rules
CREATE TABLE IF NOT EXISTS public.vendor_rule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  rule_type rule_type NOT NULL,
  rule_value JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.vendor_rule ADD CONSTRAINT vendor_rule_vendor_id_rule_type_key UNIQUE(vendor_id, rule_type);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- 2. REQUEST table as the canonical state machine
CREATE TABLE IF NOT EXISTS public.request (
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
CREATE TABLE IF NOT EXISTS public.vendor_roster (
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
CREATE TABLE IF NOT EXISTS public.match_candidate (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  roster_id UUID,
  eligibility_score INTEGER NOT NULL DEFAULT 0,
  distance_miles DECIMAL(6,2),
  review_score DECIMAL(3,2),
  final_rank INTEGER NOT NULL,
  eligibility_reasons JSONB DEFAULT '{}',
  disqualified BOOLEAN DEFAULT false,
  disqualification_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
    ALTER TABLE public.match_candidate ADD CONSTRAINT match_candidate_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.request(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.match_candidate ADD CONSTRAINT match_candidate_roster_id_fkey FOREIGN KEY (roster_id) REFERENCES public.vendor_roster(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. MATCH_ROUTING table for routing decisions and tie-breakers
CREATE TABLE IF NOT EXISTS public.match_routing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  selected_candidate_id UUID,
  routing_algorithm TEXT NOT NULL DEFAULT 'distance_reviews_alpha',
  tie_breaker_applied TEXT,
  routing_reasons JSONB DEFAULT '{}',
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
    ALTER TABLE public.match_routing ADD CONSTRAINT match_routing_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.request(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.match_routing ADD CONSTRAINT match_routing_selected_candidate_id_fkey FOREIGN KEY (selected_candidate_id) REFERENCES public.match_candidate(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 6. VENDOR_DECISION table for approve/counter/decline responses
CREATE TABLE IF NOT EXISTS public.vendor_decision (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  roster_id UUID,
  decision_type decision_type NOT NULL,
  counter_offer_amount NUMERIC,
  counter_terms JSONB,
  decision_notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  decided_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  decided_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
    ALTER TABLE public.vendor_decision ADD CONSTRAINT vendor_decision_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.request(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.vendor_decision ADD CONSTRAINT vendor_decision_roster_id_fkey FOREIGN KEY (roster_id) REFERENCES public.vendor_roster(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_vendor_rule_vendor_id ON public.vendor_rule(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_rule_active ON public.vendor_rule(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_request_status ON public.request(status);
CREATE INDEX IF NOT EXISTS idx_request_agent_id ON public.request(agent_id);
CREATE INDEX IF NOT EXISTS idx_request_expires_at ON public.request(expires_at);
CREATE INDEX IF NOT EXISTS idx_request_created_at ON public.request(created_at);

CREATE INDEX IF NOT EXISTS idx_vendor_roster_vendor_id ON public.vendor_roster(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_roster_active ON public.vendor_roster(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vendor_roster_location ON public.vendor_roster(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_match_candidate_request_id ON public.match_candidate(request_id);
CREATE INDEX IF NOT EXISTS idx_match_candidate_rank ON public.match_candidate(final_rank);
CREATE INDEX IF NOT EXISTS idx_match_candidate_eligible ON public.match_candidate(disqualified) WHERE disqualified = false;

CREATE INDEX IF NOT EXISTS idx_match_routing_request_id ON public.match_routing(request_id);

CREATE INDEX IF NOT EXISTS idx_vendor_decision_request_id ON public.vendor_decision(request_id);
CREATE INDEX IF NOT EXISTS idx_vendor_decision_vendor_id ON public.vendor_decision(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_decision_expires_at ON public.vendor_decision(expires_at);

-- Enable RLS on all new tables
ALTER TABLE public.vendor_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.vendor_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_decision ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Admins can manage vendor rules" ON public.vendor_rule;
CREATE POLICY "Admins can manage vendor rules" ON public.vendor_rule
  FOR ALL USING (get_user_admin_status());

DROP POLICY IF EXISTS "Vendors can view their own rules" ON public.vendor_rule;
CREATE POLICY "Vendors can view their own rules" ON public.vendor_rule
  FOR SELECT USING (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Vendors can update their own rules" ON public.vendor_rule;
CREATE POLICY "Vendors can update their own rules" ON public.vendor_rule
  FOR UPDATE USING (auth.uid() = vendor_id);

-- Request policies
DROP POLICY IF EXISTS "Admins can view all requests" ON public.request;
CREATE POLICY "Admins can view all requests" ON public.request
  FOR SELECT USING (get_user_admin_status());

DROP POLICY IF EXISTS "Agents can manage their own requests" ON public.request;
CREATE POLICY "Agents can manage their own requests" ON public.request
  FOR ALL USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "System can update request status" ON public.request;
CREATE POLICY "System can update request status" ON public.request
  FOR UPDATE USING (true);

-- Vendor roster policies
DROP POLICY IF EXISTS "Admins can manage vendor roster" ON public.vendor_roster;
CREATE POLICY "Admins can manage vendor roster" ON public.vendor_roster
  FOR ALL USING (get_user_admin_status());

DROP POLICY IF EXISTS "Vendors can manage their own roster" ON public.vendor_roster;
CREATE POLICY "Vendors can manage their own roster" ON public.vendor_roster
  FOR ALL USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Active roster entries are viewable" ON public.vendor_roster;
CREATE POLICY "Active roster entries are viewable" ON public.vendor_roster
  FOR SELECT USING (is_active = true);

-- Match candidate policies
DROP POLICY IF EXISTS "Admins can view all match candidates" ON public.match_candidate;
CREATE POLICY "Admins can view all match candidates" ON public.match_candidate
  FOR SELECT USING (get_user_admin_status());

DROP POLICY IF EXISTS "System can manage match candidates" ON public.match_candidate;
CREATE POLICY "System can manage match candidates" ON public.match_candidate
  FOR ALL USING (true);

-- Match routing policies  
DROP POLICY IF EXISTS "Admins can view match routing" ON public.match_routing;
CREATE POLICY "Admins can view match routing" ON public.match_routing
  FOR SELECT USING (get_user_admin_status());

DROP POLICY IF EXISTS "System can manage match routing" ON public.match_routing;
CREATE POLICY "System can manage match routing" ON public.match_routing
  FOR ALL USING (true);

-- Vendor decision policies
DROP POLICY IF EXISTS "Admins can view all vendor decisions" ON public.vendor_decision;
CREATE POLICY "Admins can view all vendor decisions" ON public.vendor_decision
  FOR SELECT USING (get_user_admin_status());

DROP POLICY IF EXISTS "Vendors can manage their own decisions" ON public.vendor_decision;
CREATE POLICY "Vendors can manage their own decisions" ON public.vendor_decision
  FOR ALL USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Agents can view decisions for their requests" ON public.vendor_decision;
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

DROP TRIGGER IF EXISTS update_vendor_rule_updated_at ON public.vendor_rule;
CREATE TRIGGER update_vendor_rule_updated_at 
    BEFORE UPDATE ON public.vendor_rule 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_request_updated_at ON public.request;
CREATE TRIGGER update_request_updated_at 
    BEFORE UPDATE ON public.request 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_roster_updated_at ON public.vendor_roster;
CREATE TRIGGER update_vendor_roster_updated_at 
    BEFORE UPDATE ON public.vendor_roster 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();