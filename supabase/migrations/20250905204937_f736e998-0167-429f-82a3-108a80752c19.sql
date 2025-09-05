-- Add fulfillment and commerce enums
CREATE TYPE fulfillment_type AS ENUM ('circle_checkout', 'consult_then_bill', 'vendor_checkout');
CREATE TYPE price_type AS ENUM ('fixed', 'variable', 'subscription');
CREATE TYPE order_status AS ENUM ('created', 'awaiting_quote', 'awaiting_payment', 'paid', 'in_fulfillment', 'fulfilled', 'canceled', 'refunded');
CREATE TYPE quote_status AS ENUM ('submitted', 'approved', 'rejected');
CREATE TYPE attribution_event_type AS ENUM ('click', 'trial_started', 'trial_converted', 'purchase');
CREATE TYPE payout_policy AS ENUM ('immediate', 'net7', 'milestone');

-- Add fulfillment fields to services (acting as listings)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS fulfillment_type fulfillment_type NOT NULL DEFAULT 'vendor_checkout';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS price_type price_type NOT NULL DEFAULT 'fixed';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS vendor_offer_code TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS vendor_checkout_url TEXT;

-- Add connect and payout fields to vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS connect_account_id TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS payout_policy payout_policy DEFAULT 'immediate';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'created',
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_intent_id TEXT,
  checkout_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create consults table
CREATE TABLE IF NOT EXISTS public.consults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ,
  notes TEXT,
  setup_intent_id TEXT,
  pm_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  line_items JSONB DEFAULT '[]'::jsonb,
  attachment_urls JSONB DEFAULT '[]'::jsonb,
  status quote_status NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transfers table
CREATE TABLE IF NOT EXISTS public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  stripe_transfer_id TEXT NOT NULL,
  destination_connect_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create attribution_events table
CREATE TABLE IF NOT EXISTS public.attribution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  agent_id UUID,
  listing_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  event_type attribution_event_type NOT NULL,
  external_order_id TEXT,
  offer_code TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders
CREATE POLICY "Agents can view their own orders" ON public.orders
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Vendors can view orders for their services" ON public.orders
  FOR SELECT USING (vendor_id = auth.uid());

CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (get_user_admin_status());

CREATE POLICY "System can manage orders" ON public.orders
  FOR ALL USING (true);

-- Create RLS policies for consults
CREATE POLICY "Agents can manage their consults" ON public.consults
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = consults.order_id AND o.agent_id = auth.uid())
  );

CREATE POLICY "Vendors can manage consults for their orders" ON public.consults
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = consults.order_id AND o.vendor_id = auth.uid())
  );

CREATE POLICY "Admins can manage all consults" ON public.consults
  FOR ALL USING (get_user_admin_status());

-- Create RLS policies for quotes
CREATE POLICY "Agents can view quotes for their orders" ON public.quotes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = quotes.order_id AND o.agent_id = auth.uid())
  );

CREATE POLICY "Vendors can manage quotes for their orders" ON public.quotes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = quotes.order_id AND o.vendor_id = auth.uid())
  );

CREATE POLICY "Admins can manage all quotes" ON public.quotes
  FOR ALL USING (get_user_admin_status());

-- Create RLS policies for transfers
CREATE POLICY "Vendors can view their transfers" ON public.transfers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = transfers.order_id AND o.vendor_id = auth.uid())
  );

CREATE POLICY "Admins can manage all transfers" ON public.transfers
  FOR ALL USING (get_user_admin_status());

CREATE POLICY "System can manage transfers" ON public.transfers
  FOR ALL USING (true);

-- Create RLS policies for attribution_events
CREATE POLICY "Vendors can view their attribution events" ON public.attribution_events
  FOR SELECT USING (vendor_id = auth.uid());

CREATE POLICY "Agents can view their attribution events" ON public.attribution_events
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Admins can manage all attribution events" ON public.attribution_events
  FOR ALL USING (get_user_admin_status());

CREATE POLICY "System can create attribution events" ON public.attribution_events
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_agent_id ON public.orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_consults_order_id ON public.consults(order_id);
CREATE INDEX IF NOT EXISTS idx_quotes_order_id ON public.quotes(order_id);
CREATE INDEX IF NOT EXISTS idx_transfers_order_id ON public.transfers(order_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_vendor_id ON public.attribution_events(vendor_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_agent_id ON public.attribution_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_listing_id ON public.attribution_events(listing_id);