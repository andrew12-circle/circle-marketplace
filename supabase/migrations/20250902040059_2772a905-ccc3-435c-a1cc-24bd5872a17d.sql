-- Update the check constraint to include sponsored event types that are currently being used
ALTER TABLE service_tracking_events DROP CONSTRAINT IF EXISTS service_tracking_events_event_check;

ALTER TABLE service_tracking_events 
  ADD CONSTRAINT service_tracking_events_event_check 
  CHECK (
    (event_type IS NOT NULL AND event_type IN ('view', 'click', 'booking', 'purchase', 'conversion', 'sponsored_impression', 'sponsored_click')) 
    OR 
    (event_name IS NOT NULL)
  );