-- Create fraud monitoring tables
CREATE TABLE public.fraud_monitoring_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  risk_score INTEGER,
  risk_level TEXT, -- 'normal', 'elevated', 'highest'
  outcome_type TEXT, -- 'authorized', 'manual_review', 'issuer_declined', 'blocked'
  outcome_reason TEXT,
  radar_rules_triggered JSONB DEFAULT '[]'::jsonb,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  customer_email TEXT,
  payment_method_details JSONB DEFAULT '{}'::jsonb,
  billing_details JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  requires_action BOOLEAN DEFAULT false,
  fraud_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fraud_monitoring_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all fraud logs" ON public.fraud_monitoring_logs
  FOR SELECT USING (get_user_admin_status());

CREATE POLICY "System can insert fraud logs" ON public.fraud_monitoring_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update fraud logs" ON public.fraud_monitoring_logs
  FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX idx_fraud_logs_risk_score ON public.fraud_monitoring_logs(risk_score);
CREATE INDEX idx_fraud_logs_risk_level ON public.fraud_monitoring_logs(risk_level);
CREATE INDEX idx_fraud_logs_outcome_type ON public.fraud_monitoring_logs(outcome_type);
CREATE INDEX idx_fraud_logs_created_at ON public.fraud_monitoring_logs(created_at);
CREATE INDEX idx_fraud_logs_stripe_payment_intent ON public.fraud_monitoring_logs(stripe_payment_intent_id);

-- Create webhook events table for Stripe Radar
CREATE TABLE public.stripe_radar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payment_intent_id TEXT,
  charge_id TEXT,
  customer_id TEXT,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_radar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all radar events" ON public.stripe_radar_events
  FOR SELECT USING (get_user_admin_status());

CREATE POLICY "System can manage radar events" ON public.stripe_radar_events
  FOR ALL USING (true);

-- Create fraud alerts table
CREATE TABLE public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fraud_log_id UUID REFERENCES public.fraud_monitoring_logs(id),
  alert_type TEXT NOT NULL, -- 'high_risk_score', 'manual_review_required', 'blocked_payment', 'chargeback_warning'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  alert_message TEXT NOT NULL,
  alert_data JSONB DEFAULT '{}'::jsonb,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage fraud alerts" ON public.fraud_alerts
  FOR ALL USING (get_user_admin_status());

-- Create indexes
CREATE INDEX idx_fraud_alerts_severity ON public.fraud_alerts(severity);
CREATE INDEX idx_fraud_alerts_acknowledged ON public.fraud_alerts(acknowledged);
CREATE INDEX idx_fraud_alerts_created_at ON public.fraud_alerts(created_at);