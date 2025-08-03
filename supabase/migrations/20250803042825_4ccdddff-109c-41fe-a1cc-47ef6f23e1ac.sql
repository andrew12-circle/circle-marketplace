-- Enable RLS on vendors table
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Enable RLS on services table  
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active vendors
CREATE POLICY "Public read access to active vendors" 
ON public.vendors 
FOR SELECT 
USING (is_active = true);

-- Allow vendors to manage their own data
CREATE POLICY "Vendors can manage their own data" 
ON public.vendors 
FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to manage all vendors
CREATE POLICY "Admins can manage all vendors" 
ON public.vendors 
FOR ALL 
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

-- Allow public read access to services
CREATE POLICY "Public read access to services" 
ON public.services 
FOR SELECT 
USING (true);

-- Allow vendors to manage their own services
CREATE POLICY "Vendors can manage their own services" 
ON public.services 
FOR ALL 
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- Allow admins to manage all services
CREATE POLICY "Admins can manage all services" 
ON public.services 
FOR ALL 
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());