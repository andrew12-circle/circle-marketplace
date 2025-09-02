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