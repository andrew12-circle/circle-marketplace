-- Add support for vendor hierarchies and location-based filtering

-- First, add columns to existing vendors table for hierarchy and enhanced location support
ALTER TABLE public.vendors 
ADD COLUMN parent_vendor_id UUID REFERENCES public.vendors(id),
ADD COLUMN vendor_type TEXT DEFAULT 'company' CHECK (vendor_type IN ('company', 'individual', 'branch')),
ADD COLUMN license_states TEXT[],
ADD COLUMN service_zip_codes TEXT[],
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN individual_name TEXT,
ADD COLUMN individual_title TEXT,
ADD COLUMN individual_phone TEXT,
ADD COLUMN individual_email TEXT,
ADD COLUMN individual_license_number TEXT,
ADD COLUMN nmls_id TEXT,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create index for better performance on location queries
CREATE INDEX idx_vendors_parent_id ON public.vendors(parent_vendor_id);
CREATE INDEX idx_vendors_license_states ON public.vendors USING GIN(license_states);
CREATE INDEX idx_vendors_service_zip_codes ON public.vendors USING GIN(service_zip_codes);
CREATE INDEX idx_vendors_location ON public.vendors(latitude, longitude);
CREATE INDEX idx_vendors_type_active ON public.vendors(vendor_type, is_active);

-- Create a function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DECIMAL(10, 8),
  lon1 DECIMAL(11, 8),
  lat2 DECIMAL(10, 8),
  lon2 DECIMAL(11, 8)
) RETURNS DECIMAL AS $$
DECLARE
  radius DECIMAL := 3959; -- Earth radius in miles
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN radius * c;
END;
$$ LANGUAGE plpgsql;

-- Create a view for vendors with their local representatives
CREATE OR REPLACE VIEW public.vendors_with_local_reps AS
SELECT 
  v.*,
  (
    SELECT json_agg(
      json_build_object(
        'id', rep.id,
        'name', rep.individual_name,
        'title', rep.individual_title,
        'phone', rep.individual_phone,
        'email', rep.individual_email,
        'license_number', rep.individual_license_number,
        'nmls_id', rep.nmls_id,
        'location', rep.location,
        'latitude', rep.latitude,
        'longitude', rep.longitude
      )
    )
    FROM public.vendors rep 
    WHERE rep.parent_vendor_id = v.id 
    AND rep.vendor_type IN ('individual', 'branch')
    AND rep.is_active = true
  ) as local_representatives
FROM public.vendors v
WHERE v.vendor_type = 'company' AND v.is_active = true;

-- Insert sample data for testing
-- Sample mortgage company
INSERT INTO public.vendors (
  name, 
  description, 
  vendor_type, 
  license_states, 
  location,
  contact_email,
  phone,
  rating,
  review_count,
  is_verified,
  co_marketing_agents,
  campaigns_funded,
  service_radius_miles
) VALUES (
  'First National Mortgage',
  'Leading mortgage lender with nationwide coverage and local expertise',
  'company',
  ARRAY['TN', 'KY', 'GA', 'AL', 'NC', 'SC', 'FL'],
  'Nashville, TN',
  'partnerships@firstnationalmortgage.com',
  '615-555-0100',
  4.8,
  245,
  true,
  67,
  89,
  100
);

-- Get the company ID for adding loan officers
DO $$
DECLARE
  company_id UUID;
BEGIN
  SELECT id INTO company_id FROM public.vendors WHERE name = 'First National Mortgage';
  
  -- Add sample loan officers in different locations
  INSERT INTO public.vendors (
    parent_vendor_id,
    name,
    individual_name,
    individual_title,
    individual_phone,
    individual_email,
    individual_license_number,
    nmls_id,
    vendor_type,
    license_states,
    location,
    latitude,
    longitude,
    description,
    rating,
    review_count,
    is_verified,
    is_active
  ) VALUES 
  (
    company_id,
    'First National Mortgage - Sarah Johnson',
    'Sarah Johnson',
    'Senior Loan Officer',
    '615-555-0101',
    'sarah.johnson@fnm.com',
    'TN-LO-12345',
    '123456',
    'individual',
    ARRAY['TN', 'KY'],
    'Nashville, TN',
    36.1627,
    -86.7816,
    'Specializing in first-time homebuyer programs and VA loans',
    4.9,
    89,
    true,
    true
  ),
  (
    company_id,
    'First National Mortgage - Mike Chen',
    'Mike Chen',
    'Loan Officer',
    '615-555-0102',
    'mike.chen@fnm.com',
    'TN-LO-67890',
    '789012',
    'individual',
    ARRAY['TN'],
    'Franklin, TN',
    35.9251,
    -86.8689,
    'Expert in jumbo loans and investment properties',
    4.7,
    67,
    true,
    true
  ),
  (
    company_id,
    'First National Mortgage - Lisa Davis',
    'Lisa Davis',
    'Branch Manager',
    '404-555-0103',
    'lisa.davis@fnm.com',
    'GA-LO-54321',
    '345678',
    'individual',
    ARRAY['GA', 'AL'],
    'Atlanta, GA',
    33.7490,
    -84.3880,
    'Leading the Atlanta branch with focus on luxury home financing',
    4.8,
    134,
    true,
    true
  );
END $$;

-- Sample title company
INSERT INTO public.vendors (
  name,
  description,
  vendor_type,
  license_states,
  location,
  contact_email,
  phone,
  rating,
  review_count,
  is_verified,
  co_marketing_agents,
  campaigns_funded,
  service_radius_miles
) VALUES (
  'Premier Title Services',
  'Full-service title company providing comprehensive closing services',
  'company',
  ARRAY['TN', 'KY', 'GA'],
  'Nashville, TN',
  'partnerships@premiertitle.com',
  '615-555-0200',
  4.6,
  178,
  true,
  43,
  67,
  75
);

-- Sample moving company (non-RESPA)
INSERT INTO public.vendors (
  name,
  description,
  vendor_type,
  license_states,
  location,
  contact_email,
  phone,
  rating,
  review_count,
  is_verified,
  co_marketing_agents,
  campaigns_funded,
  service_radius_miles,
  latitude,
  longitude
) VALUES (
  'Nashville Moving Pros',
  'Professional moving services for residential and commercial clients',
  'company',
  ARRAY['TN', 'KY', 'AL'],
  'Nashville, TN',
  'partnerships@nashvillemovingpros.com',
  '615-555-0300',
  4.7,
  234,
  true,
  28,
  45,
  50,
  36.1627,
  -86.7816
);