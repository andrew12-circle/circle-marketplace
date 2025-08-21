-- Add facilitator checkout feature flag to app_config
ALTER TABLE public.app_config 
ADD COLUMN facilitator_checkout_enabled boolean DEFAULT false;

-- Add vendor split-pay configuration
ALTER TABLE public.vendors 
ADD COLUMN accepts_split_payments boolean DEFAULT true,
ADD COLUMN requires_circle_payout boolean DEFAULT false,
ADD COLUMN facilitator_fee_percentage numeric DEFAULT 3.0;

-- Create copay_orders table for new facilitator flow
CREATE TABLE public.copay_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  service_id UUID NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  agent_amount NUMERIC NOT NULL,
  partner_contribution_amount NUMERIC DEFAULT 0,
  facilitator_fee_amount NUMERIC DEFAULT 0,
  total_service_amount NUMERIC NOT NULL,
  agent_stripe_payment_intent_id TEXT,
  partner_stripe_payment_intent_id TEXT,
  agent_payment_status TEXT DEFAULT 'pending',
  partner_payment_status TEXT DEFAULT 'pending',
  vendor_payout_status TEXT DEFAULT 'pending',
  agent_acknowledged_primary_payer BOOLEAN DEFAULT false,
  partner_type TEXT, -- 'lender', 'title_company', etc.
  partner_email TEXT,
  partner_contact_info JSONB DEFAULT '{}',
  order_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create partner_contributions table
CREATE TABLE public.partner_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copay_order_id UUID NOT NULL REFERENCES copay_orders(id) ON DELETE CASCADE,
  partner_type TEXT NOT NULL,
  partner_email TEXT NOT NULL,
  contribution_amount NUMERIC NOT NULL,
  invitation_sent_at TIMESTAMPTZ,
  invitation_accepted_at TIMESTAMPTZ,
  payment_completed_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  invitation_token TEXT UNIQUE,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '48 hours'),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create vendor_payouts table
CREATE TABLE public.vendor_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copay_order_id UUID NOT NULL REFERENCES copay_orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL,
  payout_amount NUMERIC NOT NULL,
  payout_method TEXT DEFAULT 'manual', -- 'manual', 'stripe_connect'
  payout_status TEXT DEFAULT 'pending',
  stripe_transfer_id TEXT,
  payout_completed_at TIMESTAMPTZ,
  payout_reference TEXT,
  payout_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.copay_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for copay_orders
CREATE POLICY "Agents can view their own orders" 
ON public.copay_orders FOR SELECT 
USING (auth.uid() = agent_id);

CREATE POLICY "Vendors can view their orders" 
ON public.copay_orders FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "Agents can create orders" 
ON public.copay_orders FOR INSERT 
WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "System can update orders" 
ON public.copay_orders FOR UPDATE 
USING (true);

CREATE POLICY "Admins can manage all orders" 
ON public.copay_orders FOR ALL 
USING (get_user_admin_status());

-- RLS Policies for partner_contributions
CREATE POLICY "Order participants can view contributions" 
ON public.partner_contributions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM copay_orders 
  WHERE id = partner_contributions.copay_order_id 
  AND (agent_id = auth.uid() OR vendor_id = auth.uid())
));

CREATE POLICY "System can manage contributions" 
ON public.partner_contributions FOR ALL 
USING (true);

CREATE POLICY "Admins can manage all contributions" 
ON public.partner_contributions FOR ALL 
USING (get_user_admin_status());

-- RLS Policies for vendor_payouts
CREATE POLICY "Vendors can view their payouts" 
ON public.vendor_payouts FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "System can manage payouts" 
ON public.vendor_payouts FOR ALL 
USING (true);

CREATE POLICY "Admins can manage all payouts" 
ON public.vendor_payouts FOR ALL 
USING (get_user_admin_status());

-- Create indexes for performance
CREATE INDEX idx_copay_orders_agent_id ON copay_orders(agent_id);
CREATE INDEX idx_copay_orders_vendor_id ON copay_orders(vendor_id);
CREATE INDEX idx_copay_orders_service_id ON copay_orders(service_id);
CREATE INDEX idx_copay_orders_order_number ON copay_orders(order_number);

CREATE INDEX idx_partner_contributions_order_id ON partner_contributions(copay_order_id);
CREATE INDEX idx_partner_contributions_invitation_token ON partner_contributions(invitation_token);
CREATE INDEX idx_partner_contributions_partner_email ON partner_contributions(partner_email);

CREATE INDEX idx_vendor_payouts_order_id ON vendor_payouts(copay_order_id);
CREATE INDEX idx_vendor_payouts_vendor_id ON vendor_payouts(vendor_id);

-- Create triggers for updated_at
CREATE TRIGGER update_copay_orders_updated_at
  BEFORE UPDATE ON copay_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_contributions_updated_at
  BEFORE UPDATE ON partner_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_payouts_updated_at
  BEFORE UPDATE ON vendor_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();