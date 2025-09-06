-- Enable RLS on tables that need it
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_events ENABLE ROW LEVEL SECURITY;

-- Create orders policies (orders has user_id column)
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (get_user_admin_status());

-- Create consults policies (consults links to orders via order_id)
CREATE POLICY "Users can view their consults" ON public.consults FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = consults.order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create consults" ON public.consults FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update their consults" ON public.consults FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = consults.order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage consults" ON public.consults FOR ALL USING (get_user_admin_status());

-- Create quotes policies (quotes link to orders via order_id)
CREATE POLICY "Users can view their quotes" ON public.quotes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = quotes.order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create quotes" ON public.quotes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update their quotes" ON public.quotes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = quotes.order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage quotes" ON public.quotes FOR ALL USING (get_user_admin_status());

-- Create transfers policies (transfers link to orders via order_id)
CREATE POLICY "Users can view their transfers" ON public.transfers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = transfers.order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage transfers" ON public.transfers FOR ALL USING (get_user_admin_status());
CREATE POLICY "System can manage transfers" ON public.transfers FOR ALL USING (true);

-- Create attribution events policies (attribution_events has user_id)
CREATE POLICY "Users can view their attribution events" ON public.attribution_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage attribution events" ON public.attribution_events FOR ALL USING (true);
CREATE POLICY "Admins can view attribution events" ON public.attribution_events FOR SELECT USING (get_user_admin_status());