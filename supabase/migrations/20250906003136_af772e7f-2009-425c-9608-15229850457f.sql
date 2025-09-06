-- First ensure vendor_id column exists on orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vendor_id UUID;

-- Enable RLS on tables that need it
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_events ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can view orders for their services" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

-- Create orders policies
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vendors can view orders" ON public.orders FOR SELECT USING (vendor_id = auth.uid());
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (get_user_admin_status());

-- Create consults policies
CREATE POLICY "Users can view own consults" ON public.consults FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own consults" ON public.consults FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own consults" ON public.consults FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vendors can view consults" ON public.consults FOR SELECT USING (vendor_id = auth.uid());
CREATE POLICY "Admins can manage consults" ON public.consults FOR ALL USING (get_user_admin_status());

-- Create quotes policies
CREATE POLICY "Users can view own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage quotes" ON public.quotes FOR ALL USING (get_user_admin_status());

-- Create transfers policies
CREATE POLICY "Users can view own transfers" ON public.transfers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage transfers" ON public.transfers FOR ALL USING (get_user_admin_status());
CREATE POLICY "System can manage transfers" ON public.transfers FOR ALL USING (true);

-- Create attribution events policies
CREATE POLICY "System can manage attribution events" ON public.attribution_events FOR ALL USING (true);
CREATE POLICY "Admins can view attribution events" ON public.attribution_events FOR SELECT USING (get_user_admin_status());