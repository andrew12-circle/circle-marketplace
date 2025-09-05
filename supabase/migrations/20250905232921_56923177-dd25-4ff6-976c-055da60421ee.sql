-- Fix RLS policies for tables missing them

-- Enable RLS and add policies for orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vendors can view orders for their services" ON public.orders FOR SELECT USING (
  vendor_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.services WHERE id = orders.listing_id AND vendor_id = auth.uid())
);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (get_user_admin_status());

-- Enable RLS and add policies for consults table  
ALTER TABLE public.consults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consults" ON public.consults FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own consults" ON public.consults FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own consults" ON public.consults FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vendors can view consults for their services" ON public.consults FOR SELECT USING (
  vendor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.services WHERE id = consults.service_id AND vendor_id = auth.uid())
);
CREATE POLICY "Admins can manage all consults" ON public.consults FOR ALL USING (get_user_admin_status());

-- Enable RLS and add policies for quotes table
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vendors can view quotes for their orders" ON public.quotes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = quotes.order_id AND vendor_id = auth.uid())
);
CREATE POLICY "Vendors can create quotes for their orders" ON public.quotes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND vendor_id = auth.uid())
);
CREATE POLICY "Admins can manage all quotes" ON public.quotes FOR ALL USING (get_user_admin_status());

-- Enable RLS and add policies for transfers table
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transfers" ON public.transfers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all transfers" ON public.transfers FOR ALL USING (get_user_admin_status());
CREATE POLICY "System can manage transfers" ON public.transfers FOR ALL USING (true);