-- Add vendor control fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN vendor_enabled boolean DEFAULT false,
ADD COLUMN vendor_type text DEFAULT NULL CHECK (vendor_type IN ('service_provider', 'co_marketing', NULL)),
ADD COLUMN vendor_company_name text DEFAULT NULL,
ADD COLUMN vendor_description text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.vendor_enabled IS 'Controls whether user has access to vendor dashboard';
COMMENT ON COLUMN public.profiles.vendor_type IS 'Type of vendor: service_provider or co_marketing';
COMMENT ON COLUMN public.profiles.vendor_company_name IS 'Company name for vendor operations';
COMMENT ON COLUMN public.profiles.vendor_description IS 'Company description for vendor operations';