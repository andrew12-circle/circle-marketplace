-- Add vendor_id column to service_tracking_events table for commission tracking
ALTER TABLE public.service_tracking_events 
ADD COLUMN vendor_id UUID;

-- Add index for better performance on vendor queries
CREATE INDEX idx_service_tracking_events_vendor_id 
ON public.service_tracking_events(vendor_id);

-- Add index for commission tracking queries
CREATE INDEX idx_service_tracking_events_vendor_event_type 
ON public.service_tracking_events(vendor_id, event_type, created_at);