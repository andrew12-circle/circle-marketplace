-- Add auto-approval rules for vendors
CREATE TABLE public.vendor_copay_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  auto_approve_threshold INTEGER DEFAULT 20, -- Auto-approve splits under this percentage
  max_split_percentage INTEGER DEFAULT 50, -- Maximum allowed split percentage
  monthly_limit_per_agent NUMERIC DEFAULT 1000.00, -- Monthly spending limit per agent
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_copay_rules ENABLE ROW LEVEL SECURITY;

-- Policies for vendor rules
CREATE POLICY "Vendors can manage their own rules" ON public.vendor_copay_rules
FOR ALL USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all rules" ON public.vendor_copay_rules
FOR ALL USING (get_user_admin_status());

-- Add agent spending tracking
CREATE TABLE public.agent_copay_spending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  total_spent NUMERIC DEFAULT 0.00,
  total_requests INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, vendor_id, month_year)
);

-- Enable RLS
ALTER TABLE public.agent_copay_spending ENABLE ROW LEVEL SECURITY;

-- Policies for spending tracking
CREATE POLICY "Agents can view their own spending" ON public.agent_copay_spending
FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Vendors can view spending for their services" ON public.agent_copay_spending
FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can view all spending" ON public.agent_copay_spending
FOR SELECT USING (get_user_admin_status());

CREATE POLICY "System can update spending" ON public.agent_copay_spending
FOR ALL USING (true);

-- Add payment processing table
CREATE TABLE public.copay_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copay_request_id UUID NOT NULL REFERENCES co_pay_requests(id),
  order_id UUID,
  stripe_payment_intent_id TEXT,
  agent_amount NUMERIC NOT NULL, -- Amount agent pays
  vendor_reimbursement NUMERIC NOT NULL, -- Amount vendor gets reimbursed
  total_service_amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.copay_payments ENABLE ROW LEVEL SECURITY;

-- Policies for payments
CREATE POLICY "Users can view their own copay payments" ON public.copay_payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM co_pay_requests 
    WHERE co_pay_requests.id = copay_payments.copay_request_id 
    AND (co_pay_requests.agent_id = auth.uid() OR co_pay_requests.vendor_id = auth.uid())
  )
);

CREATE POLICY "System can manage payments" ON public.copay_payments
FOR ALL USING (true);

-- Add notification preferences
CREATE TABLE public.copay_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  request_created BOOLEAN DEFAULT true,
  request_approved BOOLEAN DEFAULT true,
  request_declined BOOLEAN DEFAULT true,
  payment_processed BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.copay_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for notification preferences
CREATE POLICY "Users can manage their own preferences" ON public.copay_notification_preferences
FOR ALL USING (auth.uid() = user_id);

-- Add trigger to update spending when requests are approved
CREATE OR REPLACE FUNCTION update_agent_spending()
RETURNS TRIGGER AS $$
DECLARE
  current_month TEXT;
  service_price NUMERIC;
  copay_amount NUMERIC;
BEGIN
  -- Only update spending when status changes to approved
  IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
    current_month := to_char(now(), 'YYYY-MM');
    
    -- Get service price from services table
    SELECT COALESCE(
      CAST(REGEXP_REPLACE(pro_price, '[^0-9.]', '', 'g') AS NUMERIC),
      CAST(REGEXP_REPLACE(retail_price, '[^0-9.]', '', 'g') AS NUMERIC),
      0
    ) INTO service_price
    FROM services 
    WHERE id = NEW.service_id;
    
    -- Calculate co-pay amount
    copay_amount := service_price * (NEW.requested_split_percentage / 100.0);
    
    -- Update or insert spending record
    INSERT INTO agent_copay_spending (agent_id, vendor_id, month_year, total_spent, total_requests)
    VALUES (NEW.agent_id, NEW.vendor_id, current_month, copay_amount, 1)
    ON CONFLICT (agent_id, vendor_id, month_year)
    DO UPDATE SET
      total_spent = agent_copay_spending.total_spent + copay_amount,
      total_requests = agent_copay_spending.total_requests + 1,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;