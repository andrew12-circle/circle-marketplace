-- Ensure services.consultation_emails is never null and capped at 4
ALTER TABLE services
  ALTER COLUMN consultation_emails SET DEFAULT '{}'::text[],
  ALTER COLUMN consultation_emails SET NOT NULL;

-- Function to enforce consultation email constraints
CREATE OR REPLACE FUNCTION enforce_consultation_emails()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Normalize: trim, lower, unique, remove empty strings
  IF NEW.consultation_emails IS NULL THEN
    NEW.consultation_emails := '{}'::text[];
  ELSE
    NEW.consultation_emails := (
      SELECT array_agg(DISTINCT lower(trim(e))) FILTER (WHERE trim(e) <> '')
      FROM unnest(NEW.consultation_emails) AS e
    );
    -- Handle case where all emails were empty/invalid
    IF NEW.consultation_emails IS NULL THEN
      NEW.consultation_emails := '{}'::text[];
    END IF;
  END IF;

  -- Enforce max 4 emails
  IF array_length(NEW.consultation_emails, 1) > 4 THEN
    RAISE EXCEPTION 'Maximum 4 consultation emails allowed';
  END IF;

  RETURN NEW;
END $$;

-- Drop and recreate trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS trg_services_consultation_emails ON services;
CREATE TRIGGER trg_services_consultation_emails
  BEFORE INSERT OR UPDATE OF consultation_emails ON services
  FOR EACH ROW EXECUTE FUNCTION enforce_consultation_emails();

-- Update existing NULL values to empty arrays
UPDATE services SET consultation_emails = '{}'::text[] WHERE consultation_emails IS NULL;

-- Create indexes for better performance on admin notes
CREATE INDEX IF NOT EXISTS idx_admin_notes_service_id_created_at
  ON admin_notes(service_id, created_at DESC);

-- Ensure admin_notes.note_text column exists and is properly named
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'admin_notes' AND column_name = 'note_text') THEN
    -- If note_text doesn't exist but there's a text column, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'admin_notes' AND column_name = 'text') THEN
      ALTER TABLE admin_notes RENAME COLUMN text TO note_text;
    END IF;
  END IF;
END $$;