-- Ensure required columns exist and are properly documented
ALTER TABLE service_tracking_events 
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL,
  ADD COLUMN IF NOT EXISTS page text,
  ADD COLUMN IF NOT EXISTS context jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Document expectation
COMMENT ON COLUMN service_tracking_events.event_type IS
  'Canonical event identifier (required). Client must set this.';

-- RLS (keep ON). Allow inserts by authenticated users.
DROP POLICY IF EXISTS "ste_insert_authenticated" ON service_tracking_events;
DROP POLICY IF EXISTS "Users can log their own events" ON service_tracking_events;
DROP POLICY IF EXISTS "Users can view their own events" ON service_tracking_events;

CREATE POLICY "ste_insert_authenticated"
ON service_tracking_events
FOR INSERT
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to view their own events (and admins to view all)
CREATE POLICY "ste_select_authenticated"
ON service_tracking_events
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  get_user_admin_status() = true
);