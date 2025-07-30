-- Create vendor availability table for real-time availability status
CREATE TABLE public.vendor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  is_available_now BOOLEAN NOT NULL DEFAULT false,
  availability_message TEXT,
  next_available_slot TIMESTAMP WITH TIME ZONE,
  calendar_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id)
);

-- Enable RLS
ALTER TABLE public.vendor_availability ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view vendor availability" 
ON public.vendor_availability 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage vendor availability" 
ON public.vendor_availability 
FOR ALL
USING (get_user_admin_status());

-- Create vendor login credentials table for vendor dashboard access
CREATE TABLE public.vendor_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Vendors can view their own credentials" 
ON public.vendor_credentials 
FOR SELECT 
USING (email = auth.email());

CREATE POLICY "Only admins can manage vendor credentials" 
ON public.vendor_credentials 
FOR ALL
USING (get_user_admin_status());

-- Create consultation notifications table
CREATE TABLE public.consultation_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_booking_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- 'email', 'sms', 'webhook'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  notification_data JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultation_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Vendors can view their own notifications" 
ON public.consultation_notifications 
FOR SELECT 
USING (vendor_id IN (SELECT id FROM vendors WHERE name = ANY(
  SELECT specialties FROM profiles WHERE user_id = auth.uid() AND 'vendor' = ANY(specialties)
)));

CREATE POLICY "System can create notifications" 
ON public.consultation_notifications 
FOR INSERT 
WITH CHECK (true);

-- Create service customization table for vendor dashboard
CREATE TABLE public.service_customizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  custom_title TEXT,
  custom_description TEXT,
  custom_pricing JSONB DEFAULT '{}',
  custom_features JSONB DEFAULT '{}',
  custom_images JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, vendor_id)
);

-- Enable RLS
ALTER TABLE public.service_customizations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Vendors can view their own customizations" 
ON public.service_customizations 
FOR SELECT 
USING (vendor_id IN (SELECT id FROM vendors WHERE name = ANY(
  SELECT specialties FROM profiles WHERE user_id = auth.uid() AND 'vendor' = ANY(specialties)
)));

CREATE POLICY "Vendors can manage their own customizations" 
ON public.service_customizations 
FOR ALL
USING (vendor_id IN (SELECT id FROM vendors WHERE name = ANY(
  SELECT specialties FROM profiles WHERE user_id = auth.uid() AND 'vendor' = ANY(specialties)
)));

-- Create triggers for updated_at
CREATE TRIGGER update_vendor_availability_updated_at
BEFORE UPDATE ON public.vendor_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_credentials_updated_at
BEFORE UPDATE ON public.vendor_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_customizations_updated_at
BEFORE UPDATE ON public.service_customizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();