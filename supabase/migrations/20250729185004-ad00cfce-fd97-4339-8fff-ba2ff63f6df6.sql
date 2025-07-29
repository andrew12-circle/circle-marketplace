-- Add notes column to saved_services table
ALTER TABLE saved_services 
ADD COLUMN notes TEXT;

-- Add updated_at column to track when notes were last modified
ALTER TABLE saved_services 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_saved_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_services_updated_at
  BEFORE UPDATE ON saved_services
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_services_updated_at();