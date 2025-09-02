-- Update the service_tracking_events table CHECK constraint to allow our event types
-- First, check if the constraint exists and what it contains
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'service_tracking_events' 
      AND constraint_type = 'CHECK' 
      AND constraint_name = 'service_tracking_events_event_check'
  ) THEN
    ALTER TABLE service_tracking_events DROP CONSTRAINT service_tracking_events_event_check;
  END IF;
  
  -- Add the updated constraint with all allowed event types
  ALTER TABLE service_tracking_events
    ADD CONSTRAINT service_tracking_events_event_check
    CHECK (event_type IN (
      'assessment_viewed',
      'assessment_step', 
      'assessment_completed',
      'marketplace_viewed',
      'vendor_selected',
      'sponsored_impression',
      'sponsored_click',
      'discount_interest',
      'view',
      'click',
      'booking',
      'purchase',
      'service_viewed'
    ));
END $$;