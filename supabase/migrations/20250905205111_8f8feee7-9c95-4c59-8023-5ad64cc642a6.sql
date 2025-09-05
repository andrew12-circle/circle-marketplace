-- Create remaining tables that weren't created
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

CREATE TABLE IF NOT EXISTS public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  stripe_transfer_id TEXT NOT NULL,
  destination_connect_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attribution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id UUID,
  listing_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  event_type attribution_event_type NOT NULL,
  external_order_id TEXT,
  offer_code TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.consults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for consults (avoiding conflicts)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE policyname = 'Users can manage their consults' AND tablename = 'consults') THEN
    CREATE POLICY "Users can manage their consults" ON public.consults
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = consults.order_id AND o.user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE policyname = 'Vendors can manage consults for their orders' AND tablename = 'consults') THEN
    CREATE POLICY "Vendors can manage consults for their orders" ON public.consults
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = consults.order_id AND o.vendor_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE policyname = 'Admins can manage all consults' AND tablename = 'consults') THEN
    CREATE POLICY "Admins can manage all consults" ON public.consults
      FOR ALL USING (get_user_admin_status());
  END IF;
END $$;

-- Create RLS policies for quotes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE policyname = 'Users can view quotes for their orders' AND tablename = 'quotes') THEN
    CREATE POLICY "Users can view quotes for their orders" ON public.quotes
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = quotes.order_id AND o.user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE policyname = 'Vendors can manage quotes for their orders' AND tablename = 'quotes') THEN
    CREATE POLICY "Vendors can manage quotes for their orders" ON public.quotes
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = quotes.order_id AND o.vendor_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE policyname = 'Admins can manage all quotes' AND tablename = 'quotes') THEN
    CREATE POLICY "Admins can manage all quotes" ON public.quotes
      FOR ALL USING (get_user_admin_status());
  END IF;
END $$;

-- Create RLS policies for transfers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE policyname = 'Vendors can view their transfers' AND tablename = 'transfers') THEN
    CREATE POLICY "Vendors can view their transfers" ON public.transfers
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = transfers.order_id AND o.vendor_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE policyname = 'Admins can manage all transfers' AND tablename = 'transfers') THEN
    CREATE POLICY "Admins can manage all transfers" ON public.transfers
      FOR ALL USING (get_user_admin_status());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE policyname = 'System can manage transfers' AND tablename = 'transfers') THEN
    CREATE POLICY "System can manage transfers" ON public.transfers
      FOR ALL USING (true);
  END IF;
END $$;

-- Create RLS policies for attribution_events
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE policyname = 'Vendors can view their attribution events' AND tablename = 'attribution_events') THEN
    CREATE POLICY "Vendors can view their attribution events" ON public.attribution_events
      FOR SELECT USING (vendor_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE policyname = 'Users can view their attribution events' AND tablename = 'attribution_events') THEN
    CREATE POLICY "Users can view their attribution events" ON public.attribution_events
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE policyname = 'Admins can manage all attribution events' AND tablename = 'attribution_events') THEN
    CREATE POLICY "Admins can manage all attribution events" ON public.attribution_events
      FOR ALL USING (get_user_admin_status());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE policyname = 'System can create attribution events' AND tablename = 'attribution_events') THEN
    CREATE POLICY "System can create attribution events" ON public.attribution_events
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_consults_order_id ON public.consults(order_id);
CREATE INDEX IF NOT EXISTS idx_quotes_order_id ON public.quotes(order_id);
CREATE INDEX IF NOT EXISTS idx_transfers_order_id ON public.transfers(order_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_vendor_id ON public.attribution_events(vendor_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_user_id ON public.attribution_events(user_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_listing_id ON public.attribution_events(listing_id);