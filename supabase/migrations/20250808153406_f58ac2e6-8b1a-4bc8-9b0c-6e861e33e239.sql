-- Add RLS policies for services table to fix security warnings
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Allow read access to published services for everyone
CREATE POLICY "Services are viewable by everyone" 
ON public.services 
FOR SELECT 
USING (true);

-- Allow vendors to manage their own services
CREATE POLICY "Vendors can manage their own services" 
ON public.services 
FOR ALL 
USING (auth.uid() = vendor_id);

-- Allow admins to manage all services
CREATE POLICY "Admins can manage all services" 
ON public.services 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
);

-- Create composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_services_sort_featured ON public.services (sort_order, is_featured, created_at);
CREATE INDEX IF NOT EXISTS idx_services_category_tags ON public.services USING GIN (category, tags);
CREATE INDEX IF NOT EXISTS idx_services_vendor_status ON public.services (vendor_id, is_active) WHERE is_active = true;

-- Add RLS policies for vendors table
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Allow read access to active vendors for everyone
CREATE POLICY "Vendors are viewable by everyone" 
ON public.vendors 
FOR SELECT 
USING (true);

-- Allow vendors to manage their own profile
CREATE POLICY "Vendors can manage their own profile" 
ON public.vendors 
FOR ALL 
USING (auth.uid() = user_id);

-- Allow admins to manage all vendors
CREATE POLICY "Admins can manage all vendors" 
ON public.vendors 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
);

-- Create composite indexes for vendor queries
CREATE INDEX IF NOT EXISTS idx_vendors_sort_rating ON public.vendors (sort_order, rating, is_verified);
CREATE INDEX IF NOT EXISTS idx_vendors_location ON public.vendors (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;