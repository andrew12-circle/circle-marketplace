-- Add missing RLS policies for the newly created tables

-- RLS policies for consults
CREATE POLICY "Users can manage their consults" ON public.consults
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = consults.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Vendors can manage consults for their orders" ON public.consults
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = consults.order_id AND o.vendor_id = auth.uid())
  );

CREATE POLICY "Admins can manage all consults" ON public.consults
  FOR ALL USING (get_user_admin_status());

-- RLS policies for quotes
CREATE POLICY "Users can view quotes for their orders" ON public.quotes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = quotes.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Vendors can manage quotes for their orders" ON public.quotes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = quotes.order_id AND o.vendor_id = auth.uid())
  );

CREATE POLICY "Admins can manage all quotes" ON public.quotes
  FOR ALL USING (get_user_admin_status());

-- RLS policies for transfers
CREATE POLICY "Vendors can view their transfers" ON public.transfers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = transfers.order_id AND o.vendor_id = auth.uid())
  );

CREATE POLICY "Admins can manage all transfers" ON public.transfers
  FOR ALL USING (get_user_admin_status());

CREATE POLICY "System can manage transfers" ON public.transfers
  FOR ALL USING (true);

-- RLS policies for attribution_events
CREATE POLICY "Vendors can view their attribution events" ON public.attribution_events
  FOR SELECT USING (vendor_id = auth.uid());

CREATE POLICY "Users can view their attribution events" ON public.attribution_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all attribution events" ON public.attribution_events
  FOR ALL USING (get_user_admin_status());

CREATE POLICY "System can create attribution events" ON public.attribution_events
  FOR INSERT WITH CHECK (true);