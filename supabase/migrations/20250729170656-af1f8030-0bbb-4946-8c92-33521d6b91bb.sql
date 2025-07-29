-- Add enhanced location fields for better vendor-user matching

-- Add state and service area fields to vendors table
ALTER TABLE public.vendors 
ADD COLUMN service_states TEXT[] DEFAULT NULL,
ADD COLUMN mls_areas TEXT[] DEFAULT NULL,
ADD COLUMN service_radius_miles INTEGER DEFAULT NULL;

-- Add state field to profiles for user location
ALTER TABLE public.profiles 
ADD COLUMN state TEXT DEFAULT NULL,
ADD COLUMN city TEXT DEFAULT NULL,
ADD COLUMN zip_code TEXT DEFAULT NULL;

-- Create index for better performance on location queries
CREATE INDEX idx_vendors_service_states ON public.vendors USING GIN(service_states);
CREATE INDEX idx_profiles_state ON public.profiles(state);

-- Update existing location field to be more structured if needed
COMMENT ON COLUMN public.vendors.service_states IS 'Array of state codes where vendor provides services (e.g., ["CA", "NV", "AZ"])';
COMMENT ON COLUMN public.vendors.mls_areas IS 'Array of MLS areas vendor is approved for';
COMMENT ON COLUMN public.vendors.service_radius_miles IS 'Service radius in miles from vendor location';
COMMENT ON COLUMN public.profiles.state IS 'User state code (e.g., "CA", "TX")';
COMMENT ON COLUMN public.profiles.city IS 'User city';
COMMENT ON COLUMN public.profiles.zip_code IS 'User zip code';