-- Create service_representatives table for all vendor types
CREATE TABLE public.service_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT, -- "Loan Officer", "Title Agent", "Inspector", "Photographer", etc.
  email TEXT,
  phone TEXT,
  license_number TEXT, -- Professional license (NMLS, Real Estate License, etc.)
  profile_picture_url TEXT,
  bio TEXT,
  location TEXT, -- Geographic area or role designation
  specialties TEXT[], -- Industry-specific expertise
  years_experience INTEGER,
  website TEXT,
  rating NUMERIC(3,2) DEFAULT 4.5,
  reviews_count INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false, -- Main contact for vendor
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add performance indexes
CREATE INDEX idx_service_reps_vendor_id ON public.service_representatives(vendor_id);
CREATE INDEX idx_service_reps_is_active ON public.service_representatives(is_active);
CREATE INDEX idx_service_reps_is_primary ON public.service_representatives(is_primary);
CREATE INDEX idx_service_reps_sort_order ON public.service_representatives(sort_order, name);
CREATE INDEX idx_service_reps_specialties ON public.service_representatives USING GIN(specialties);

-- Enable Row Level Security
ALTER TABLE public.service_representatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Representatives are viewable by everyone" 
  ON public.service_representatives FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage all representatives" 
  ON public.service_representatives FOR ALL 
  USING (get_user_admin_status());

-- Add trigger for updated_at
CREATE TRIGGER update_service_representatives_updated_at
  BEFORE UPDATE ON public.service_representatives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing individual representative data from vendors table
INSERT INTO public.service_representatives (
  vendor_id, name, title, email, phone, license_number, 
  profile_picture_url, is_primary, location
)
SELECT 
  id, 
  individual_name, 
  COALESCE(individual_title, 'Representative'),
  individual_email, 
  individual_phone, 
  individual_license_number,
  individual_profile_picture_url, 
  true, 
  'Primary Representative'
FROM public.vendors 
WHERE individual_name IS NOT NULL AND trim(individual_name) != '';

-- Migrate local representatives from JSONB (from vendors_with_local_reps view)
INSERT INTO public.service_representatives (
  vendor_id, name, title, email, phone, location, is_primary
)
SELECT 
  v.id, 
  rep->>'name',
  COALESCE(rep->>'title', 'Representative'),
  rep->>'email', 
  rep->>'phone',
  COALESCE(rep->>'location', 'Local Representative'), 
  false
FROM vendors v,
  jsonb_array_elements(
    CASE WHEN v.parent_vendor_id IS NULL 
    THEN (SELECT local_representatives FROM vendors_with_local_reps WHERE id = v.id)
    ELSE '[]'::jsonb END
  ) AS rep
WHERE rep->>'name' IS NOT NULL AND trim(rep->>'name') != '';