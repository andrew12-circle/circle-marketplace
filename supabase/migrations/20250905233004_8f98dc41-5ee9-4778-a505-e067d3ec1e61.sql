-- Fix RLS policies for tables missing them using conditional creation

-- Enable RLS on tables (if not already enabled)
DO $$ 
BEGIN
    -- Enable RLS for orders if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'orders' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS for consults if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'consults' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.consults ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS for quotes if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'quotes' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS for transfers if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'transfers' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
    -- Orders policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own orders' AND tablename = 'orders' AND schemaname = 'public') THEN
        CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own orders' AND tablename = 'orders' AND schemaname = 'public') THEN
        CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own orders' AND tablename = 'orders' AND schemaname = 'public') THEN
        CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Vendors can view orders for their services' AND tablename = 'orders' AND schemaname = 'public') THEN
        CREATE POLICY "Vendors can view orders for their services" ON public.orders FOR SELECT USING (
            vendor_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.services WHERE id = orders.listing_id AND vendor_id = auth.uid())
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all orders' AND tablename = 'orders' AND schemaname = 'public') THEN
        CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (get_user_admin_status());
    END IF;
    
    -- Consults policies  
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own consults' AND tablename = 'consults' AND schemaname = 'public') THEN
        CREATE POLICY "Users can view their own consults" ON public.consults FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own consults' AND tablename = 'consults' AND schemaname = 'public') THEN
        CREATE POLICY "Users can create their own consults" ON public.consults FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own consults' AND tablename = 'consults' AND schemaname = 'public') THEN
        CREATE POLICY "Users can update their own consults" ON public.consults FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Vendors can view consults for their services' AND tablename = 'consults' AND schemaname = 'public') THEN
        CREATE POLICY "Vendors can view consults for their services" ON public.consults FOR SELECT USING (
            vendor_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.services WHERE id = consults.service_id AND vendor_id = auth.uid())
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all consults' AND tablename = 'consults' AND schemaname = 'public') THEN
        CREATE POLICY "Admins can manage all consults" ON public.consults FOR ALL USING (get_user_admin_status());
    END IF;
    
    -- Quotes policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own quotes' AND tablename = 'quotes' AND schemaname = 'public') THEN
        CREATE POLICY "Users can view their own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own quotes' AND tablename = 'quotes' AND schemaname = 'public') THEN
        CREATE POLICY "Users can create their own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own quotes' AND tablename = 'quotes' AND schemaname = 'public') THEN
        CREATE POLICY "Users can update their own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Vendors can view quotes for their orders' AND tablename = 'quotes' AND schemaname = 'public') THEN
        CREATE POLICY "Vendors can view quotes for their orders" ON public.quotes FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.orders WHERE id = quotes.order_id AND vendor_id = auth.uid())
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Vendors can create quotes for their orders' AND tablename = 'quotes' AND schemaname = 'public') THEN
        CREATE POLICY "Vendors can create quotes for their orders" ON public.quotes FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND vendor_id = auth.uid())
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all quotes' AND tablename = 'quotes' AND schemaname = 'public') THEN
        CREATE POLICY "Admins can manage all quotes" ON public.quotes FOR ALL USING (get_user_admin_status());
    END IF;
    
    -- Transfers policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own transfers' AND tablename = 'transfers' AND schemaname = 'public') THEN
        CREATE POLICY "Users can view their own transfers" ON public.transfers FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all transfers' AND tablename = 'transfers' AND schemaname = 'public') THEN
        CREATE POLICY "Admins can manage all transfers" ON public.transfers FOR ALL USING (get_user_admin_status());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can manage transfers' AND tablename = 'transfers' AND schemaname = 'public') THEN
        CREATE POLICY "System can manage transfers" ON public.transfers FOR ALL USING (true);
    END IF;
    
    -- Attribution events policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can manage attribution events' AND tablename = 'attribution_events' AND schemaname = 'public') THEN
        CREATE POLICY "System can manage attribution events" ON public.attribution_events FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all attribution events' AND tablename = 'attribution_events' AND schemaname = 'public') THEN
        CREATE POLICY "Admins can view all attribution events" ON public.attribution_events FOR SELECT USING (get_user_admin_status());
    END IF;
END $$;