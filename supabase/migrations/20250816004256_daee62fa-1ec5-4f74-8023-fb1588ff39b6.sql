-- Add field to control "Open to Partner" badge visibility
ALTER TABLE vendors 
ADD COLUMN is_open_to_partner BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN vendors.is_open_to_partner IS 'Controls visibility of "Open to Partner" badge and messaging on vendor cards';

-- Update any existing vendors you want to enable this for (optional)
-- UPDATE vendors SET is_open_to_partner = true WHERE name IN ('Circle Home Loans', 'Your Other Preferred Vendors');