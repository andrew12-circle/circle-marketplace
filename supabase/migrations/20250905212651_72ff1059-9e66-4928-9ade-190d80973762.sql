-- Add missing columns to existing orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vendor_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS listing_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checkout_session_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_cents INTEGER;

-- Add foreign key constraints
ALTER TABLE public.orders ADD CONSTRAINT IF NOT EXISTS orders_listing_id_fkey 
  FOREIGN KEY (listing_id) REFERENCES public.services(id) ON DELETE CASCADE;

-- Convert existing amount to amount_cents if needed
UPDATE public.orders SET amount_cents = amount * 100 WHERE amount_cents IS NULL AND amount IS NOT NULL;

-- Update status to use new enum
ALTER TABLE public.orders ALTER COLUMN status TYPE order_status USING status::order_status;

-- Add missing RLS policies for orders
CREATE POLICY IF NOT EXISTS "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update their orders" ON public.orders
  FOR UPDATE USING (user_id = auth.uid());

-- RLS policies for consults
CREATE POLICY IF NOT EXISTS "Users can manage their consults" ON public.consults
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = consults.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "Vendors can manage consults for their orders" ON public.consults
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = consults.order_id AND o.vendor_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "Admins can manage all consults" ON public.consults
  FOR ALL USING (get_user_admin_status());

-- RLS policies for quotes
CREATE POLICY IF NOT EXISTS "Users can view quotes for their orders" ON public.quotes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = quotes.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "Vendors can manage quotes for their orders" ON public.quotes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = quotes.order_id AND o.vendor_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "Admins can manage all quotes" ON public.quotes
  FOR ALL USING (get_user_admin_status());

-- RLS policies for transfers
CREATE POLICY IF NOT EXISTS "Vendors can view their transfers" ON public.transfers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = transfers.order_id AND o.vendor_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "Admins can manage all transfers" ON public.transfers
  FOR ALL USING (get_user_admin_status());

CREATE POLICY IF NOT EXISTS "System can manage transfers" ON public.transfers
  FOR ALL USING (true);

-- RLS policies for attribution_events
CREATE POLICY IF NOT EXISTS "Vendors can view their attribution events" ON public.attribution_events
  FOR SELECT USING (vendor_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can view their attribution events" ON public.attribution_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admins can manage all attribution events" ON public.attribution_events
  FOR ALL USING (get_user_admin_status());

CREATE POLICY IF NOT EXISTS "System can create attribution events" ON public.attribution_events
  FOR INSERT WITH CHECK (true);