-- Create service_tracking_events table for sponsored analytics
CREATE TABLE public.service_tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  revenue_attributed NUMERIC DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_tracking_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tracking events" 
ON public.service_tracking_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert tracking events" 
ON public.service_tracking_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all tracking events" 
ON public.service_tracking_events 
FOR SELECT 
USING (get_user_admin_status());

-- Create index for performance
CREATE INDEX idx_service_tracking_events_service_id ON public.service_tracking_events(service_id);
CREATE INDEX idx_service_tracking_events_user_id ON public.service_tracking_events(user_id);
CREATE INDEX idx_service_tracking_events_created_at ON public.service_tracking_events(created_at);

-- Seed a few services as sponsored for immediate visibility
UPDATE public.services 
SET 
  is_sponsored = true,
  sponsored_rank_boost = 10
WHERE id IN (
  SELECT id FROM public.services 
  WHERE is_active = true 
  ORDER BY RANDOM() 
  LIMIT 3
);