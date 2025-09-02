-- Update service_tracking_events table to support general event logging
-- First, remove the restrictive check constraint
ALTER TABLE service_tracking_events DROP CONSTRAINT IF EXISTS service_tracking_events_event_type_check;

-- Add new columns for general event logging if they don't exist
ALTER TABLE service_tracking_events 
  ADD COLUMN IF NOT EXISTS event_name text,
  ADD COLUMN IF NOT EXISTS page text,
  ADD COLUMN IF NOT EXISTS context jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Make service_id nullable since not all events are service-related
ALTER TABLE service_tracking_events ALTER COLUMN service_id DROP NOT NULL;

-- Create new check constraint that allows both old and new event types
ALTER TABLE service_tracking_events 
  ADD CONSTRAINT service_tracking_events_event_check 
  CHECK (
    (event_type IS NOT NULL AND event_type IN ('view', 'click', 'booking', 'purchase', 'conversion')) 
    OR 
    (event_name IS NOT NULL)
  );

-- Update RLS policies for authenticated users to insert events
DROP POLICY IF EXISTS "service_tracking_events_insert" ON service_tracking_events;

CREATE POLICY "Users can log their own events" 
ON service_tracking_events 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);

-- Allow authenticated users to view their own events
CREATE POLICY "Users can view their own events" 
ON service_tracking_events 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() = user_id OR 
  get_user_admin_status() = true
);