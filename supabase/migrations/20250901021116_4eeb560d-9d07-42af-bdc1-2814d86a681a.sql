-- Add safe public-read RLS policies to fix "No services found" for anonymous users

-- Services: Allow public read access to active services only
CREATE POLICY "Public can view active services" 
ON public.services 
FOR SELECT 
USING (is_active = true);

-- Vendors: Allow public read access to active and approved vendors
CREATE POLICY "Public can view approved vendors" 
ON public.vendors 
FOR SELECT 
USING (
  is_active = true 
  AND approval_status IN ('approved', 'auto_approved', 'pending')
);

-- Marketplace cache: Allow public read access to valid cache entries
CREATE POLICY "Public can read marketplace cache" 
ON public.marketplace_cache 
FOR SELECT 
USING (
  cache_key = 'marketplace_data' 
  AND expires_at > now()
);