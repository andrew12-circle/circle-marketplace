
-- Set booking_type to 'internal' for existing services so internal booking modal renders
UPDATE public.services
SET booking_type = 'internal'
WHERE booking_type IS NULL;

-- Ensure sync_to_ghl defaults to true for existing rows
UPDATE public.services
SET sync_to_ghl = true
WHERE sync_to_ghl IS NULL;

-- Apply default booking window (Mon-Fri, 10:00–16:00 CST, 24h in advance) if missing
UPDATE public.services
SET booking_time_rules = '{"days":["monday","tuesday","wednesday","thursday","friday"],"start_time":"10:00","end_time":"16:00","timezone":"America/Chicago","advance_hours":24}'::jsonb
WHERE booking_time_rules IS NULL;
