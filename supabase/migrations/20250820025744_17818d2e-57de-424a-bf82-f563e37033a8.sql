-- Extend consultation_bookings table for external booking support
ALTER TABLE consultation_bookings 
ADD COLUMN is_external boolean DEFAULT false,
ADD COLUMN external_provider text,
ADD COLUMN external_link text,
ADD COLUMN external_event_id text,
ADD COLUMN external_status text,
ADD COLUMN scheduled_at timestamp with time zone,
ADD COLUMN source text DEFAULT 'internal';

-- Add booking configuration to services table
ALTER TABLE services 
ADD COLUMN booking_type text DEFAULT 'internal' CHECK (booking_type IN ('internal', 'external')),
ADD COLUMN external_booking_provider text,
ADD COLUMN external_booking_url text,
ADD COLUMN booking_time_rules jsonb DEFAULT '{"days": ["monday", "tuesday", "wednesday", "thursday", "friday"], "start_time": "10:00", "end_time": "16:00", "timezone": "America/Chicago", "advance_hours": 24}'::jsonb,
ADD COLUMN sync_to_ghl boolean DEFAULT true;

-- Create webhook_events table for tracking external booking events
CREATE TABLE webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_type text NOT NULL,
  external_event_id text,
  consultation_booking_id uuid REFERENCES consultation_bookings(id),
  payload jsonb NOT NULL DEFAULT '{}',
  processed boolean DEFAULT false,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone
);

-- Enable RLS on webhook_events
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policy for webhook_events
CREATE POLICY "Admins can manage webhook events" ON webhook_events
FOR ALL USING (get_user_admin_status());

-- Create policy for system to insert webhook events
CREATE POLICY "System can insert webhook events" ON webhook_events
FOR INSERT WITH CHECK (true);