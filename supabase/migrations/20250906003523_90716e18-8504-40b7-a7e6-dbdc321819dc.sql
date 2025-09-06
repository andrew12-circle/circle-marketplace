-- Drop all existing policies on the tables
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can view orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

DROP POLICY IF EXISTS "Users can view their consults" ON public.consults;
DROP POLICY IF EXISTS "Users can create consults" ON public.consults;
DROP POLICY IF EXISTS "Users can update their consults" ON public.consults;
DROP POLICY IF EXISTS "Admins can manage consults" ON public.consults;

DROP POLICY IF EXISTS "Users can view their quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.quotes;

DROP POLICY IF EXISTS "Users can view their transfers" ON public.transfers;
DROP POLICY IF EXISTS "Admins can manage transfers" ON public.transfers;
DROP POLICY IF EXISTS "System can manage transfers" ON public.transfers;

DROP POLICY IF EXISTS "Users can view their attribution events" ON public.attribution_events;
DROP POLICY IF EXISTS "System can manage attribution events" ON public.attribution_events;
DROP POLICY IF EXISTS "Admins can view attribution events" ON public.attribution_events;

-- Now create the clean policies
-- Orders policies
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL USING (get_user_admin_status());

-- Consults policies
CREATE POLICY "Users view consults" ON public.consults FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = consults.order_id AND user_id = auth.uid())
);
CREATE POLICY "Users create consults" ON public.consults FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Users update consults" ON public.consults FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = consults.order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins manage consults" ON public.consults FOR ALL USING (get_user_admin_status());

-- Quotes policies
CREATE POLICY "Users view quotes" ON public.quotes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = quotes.order_id AND user_id = auth.uid())
);
CREATE POLICY "Users create quotes" ON public.quotes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Users update quotes" ON public.quotes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = quotes.order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins manage quotes" ON public.quotes FOR ALL USING (get_user_admin_status());

-- Transfers policies
CREATE POLICY "Users view transfers" ON public.transfers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = transfers.order_id AND user_id = auth.uid())
);
CREATE POLICY "System manage transfers" ON public.transfers FOR ALL USING (true);
CREATE POLICY "Admins manage transfers" ON public.transfers FOR ALL USING (get_user_admin_status());

-- Attribution events policies
CREATE POLICY "Users view attribution" ON public.attribution_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System manage attribution" ON public.attribution_events FOR ALL USING (true);
CREATE POLICY "Admins view attribution" ON public.attribution_events FOR SELECT USING (get_user_admin_status());