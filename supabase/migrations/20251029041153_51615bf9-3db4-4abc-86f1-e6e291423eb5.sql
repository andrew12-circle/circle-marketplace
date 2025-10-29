-- Drop the old check constraint
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_vendor_type_check;

-- Add new check constraint with SSP and Non-SSP types
ALTER TABLE vendors 
ADD CONSTRAINT vendors_vendor_type_check 
CHECK (vendor_type = ANY (ARRAY['company'::text, 'individual'::text, 'branch'::text, 'ssp'::text, 'non_ssp'::text]));

-- Now update all active vendors to SSP type
UPDATE vendors 
SET vendor_type = 'ssp' 
WHERE is_active = true;