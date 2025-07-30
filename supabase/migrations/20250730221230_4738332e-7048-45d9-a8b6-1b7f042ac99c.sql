-- Create service_views table to track service card views
CREATE TABLE public.service_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  user_id UUID NULL, -- Allow anonymous views
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET NULL,
  user_agent TEXT NULL,
  referrer_url TEXT NULL
);

-- Enable RLS
ALTER TABLE public.service_views ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create service views" 
ON public.service_views 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service owners can view their service analytics" 
ON public.service_views 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = service_views.service_id 
    AND s.vendor_id IN (
      SELECT p.user_id FROM public.profiles p 
      WHERE p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can view all service views" 
ON public.service_views 
FOR SELECT 
USING (get_user_admin_status());

-- Add index for better performance
CREATE INDEX idx_service_views_service_id ON public.service_views(service_id);
CREATE INDEX idx_service_views_viewed_at ON public.service_views(viewed_at);

-- Add foreign key constraint
ALTER TABLE public.service_views 
ADD CONSTRAINT fk_service_views_service_id 
FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;