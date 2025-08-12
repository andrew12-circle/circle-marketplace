-- Create AI interaction logging tables for rapid learning

CREATE TABLE IF NOT EXISTS public.ai_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  query_text TEXT NOT NULL,
  recommendation_text TEXT,
  intent_type TEXT NOT NULL,
  result_type TEXT NOT NULL,
  interaction_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_query_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_type TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  frequency INTEGER DEFAULT 1,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(intent_type, keywords)
);

CREATE TABLE IF NOT EXISTS public.user_ai_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  intent_type TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  last_query TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, intent_type)
);

CREATE TABLE IF NOT EXISTS public.service_outcome_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id),
  agent_id UUID REFERENCES auth.users(id),
  outcome_type TEXT NOT NULL, -- 'lead_generated', 'deal_closed', 'referral_received', etc.
  outcome_value NUMERIC DEFAULT 0, -- Dollar value or count
  roi_percentage NUMERIC DEFAULT 0,
  tracked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_performance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id),
  agent_id UUID REFERENCES auth.users(id),
  service_id UUID REFERENCES public.services(id),
  performance_metric TEXT NOT NULL, -- 'response_time', 'quality_score', 'delivery_time', etc.
  metric_value NUMERIC NOT NULL,
  tracked_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.ai_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_query_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_outcome_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_performance_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI interaction logs
CREATE POLICY "Users can view their own AI interactions"
  ON public.ai_interaction_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI interaction logs"
  ON public.ai_interaction_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all AI interactions"
  ON public.ai_interaction_logs FOR SELECT
  USING (get_user_admin_status());

-- RLS Policies for query patterns
CREATE POLICY "Admins can manage query patterns"
  ON public.ai_query_patterns FOR ALL
  USING (get_user_admin_status());

CREATE POLICY "System can manage query patterns"
  ON public.ai_query_patterns FOR ALL
  USING (true);

-- RLS Policies for user AI preferences
CREATE POLICY "Users can manage their own AI preferences"
  ON public.user_ai_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage AI preferences"
  ON public.user_ai_preferences FOR ALL
  USING (true);

-- RLS Policies for service outcome tracking
CREATE POLICY "Users can manage their own outcome tracking"
  ON public.service_outcome_tracking FOR ALL
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Admins can view all outcome tracking"
  ON public.service_outcome_tracking FOR SELECT
  USING (get_user_admin_status());

-- RLS Policies for vendor performance tracking
CREATE POLICY "Users can track their own vendor performance"
  ON public.vendor_performance_tracking FOR ALL
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Vendors can view their performance data"
  ON public.vendor_performance_tracking FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE vendors.id = vendor_performance_tracking.vendor_id 
    AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all vendor performance"
  ON public.vendor_performance_tracking FOR SELECT
  USING (get_user_admin_status());

-- Create indexes for better performance
CREATE INDEX idx_ai_interaction_logs_user_id ON public.ai_interaction_logs(user_id);
CREATE INDEX idx_ai_interaction_logs_intent_type ON public.ai_interaction_logs(intent_type);
CREATE INDEX idx_ai_interaction_logs_timestamp ON public.ai_interaction_logs(interaction_timestamp);

CREATE INDEX idx_ai_query_patterns_intent_type ON public.ai_query_patterns(intent_type);
CREATE INDEX idx_ai_query_patterns_frequency ON public.ai_query_patterns(frequency DESC);

CREATE INDEX idx_user_ai_preferences_user_id ON public.user_ai_preferences(user_id);
CREATE INDEX idx_user_ai_preferences_intent_type ON public.user_ai_preferences(intent_type);

CREATE INDEX idx_service_outcome_tracking_agent_id ON public.service_outcome_tracking(agent_id);
CREATE INDEX idx_service_outcome_tracking_service_id ON public.service_outcome_tracking(service_id);
CREATE INDEX idx_service_outcome_tracking_roi ON public.service_outcome_tracking(roi_percentage DESC);

CREATE INDEX idx_vendor_performance_tracking_vendor_id ON public.vendor_performance_tracking(vendor_id);
CREATE INDEX idx_vendor_performance_tracking_agent_id ON public.vendor_performance_tracking(agent_id);
CREATE INDEX idx_vendor_performance_tracking_date ON public.vendor_performance_tracking(tracked_date);