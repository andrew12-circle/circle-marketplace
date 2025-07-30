-- Create service_providers table as separate entity from vendors
CREATE TABLE public.service_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  phone TEXT,
  location TEXT,
  service_states TEXT[],
  mls_areas TEXT[],
  provider_type TEXT DEFAULT 'company',
  license_states TEXT[],
  service_zip_codes TEXT[],
  individual_name TEXT,
  individual_title TEXT,
  individual_phone TEXT,
  individual_email TEXT,
  individual_license_number TEXT,
  nmls_id TEXT,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  campaigns_funded INTEGER DEFAULT 0,
  co_marketing_agents INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  latitude NUMERIC,
  longitude NUMERIC,
  service_radius_miles INTEGER,
  parent_provider_id UUID REFERENCES public.service_providers(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on service_providers
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Create policies for service_providers (same as vendors)
CREATE POLICY "Service providers are viewable by everyone" 
ON public.service_providers 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert service providers" 
ON public.service_providers 
FOR INSERT 
WITH CHECK (get_user_admin_status());

CREATE POLICY "Only admins can update service providers" 
ON public.service_providers 
FOR UPDATE 
USING (get_user_admin_status());

CREATE POLICY "Admins can delete service providers" 
ON public.service_providers 
FOR DELETE 
USING (get_user_admin_status());

-- Add service_provider_id to services table (nullable for migration)
ALTER TABLE public.services ADD COLUMN service_provider_id UUID REFERENCES public.service_providers(id);

-- Create service_provider_availability table (similar to vendor_availability)
CREATE TABLE public.service_provider_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_provider_id UUID NOT NULL REFERENCES public.service_providers(id),
  is_available_now BOOLEAN NOT NULL DEFAULT false,
  availability_message TEXT,
  next_available_slot TIMESTAMP WITH TIME ZONE,
  calendar_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on service_provider_availability
ALTER TABLE public.service_provider_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for service_provider_availability
CREATE POLICY "Everyone can view service provider availability" 
ON public.service_provider_availability 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage service provider availability" 
ON public.service_provider_availability 
FOR ALL 
USING (get_user_admin_status());

-- Create service_provider_credentials table (similar to vendor_credentials)
CREATE TABLE public.service_provider_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_provider_id UUID NOT NULL REFERENCES public.service_providers(id),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on service_provider_credentials
ALTER TABLE public.service_provider_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for service_provider_credentials
CREATE POLICY "Service providers can view their own credentials" 
ON public.service_provider_credentials 
FOR SELECT 
USING (email = auth.email());

CREATE POLICY "Only admins can manage service provider credentials" 
ON public.service_provider_credentials 
FOR ALL 
USING (get_user_admin_status());

-- Create updated_at triggers for new tables
CREATE TRIGGER update_service_providers_updated_at
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_provider_availability_updated_at
  BEFORE UPDATE ON public.service_provider_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_provider_credentials_updated_at
  BEFORE UPDATE ON public.service_provider_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();