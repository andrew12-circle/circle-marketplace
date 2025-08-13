-- Add support hours field to vendors table
ALTER TABLE public.vendors 
ADD COLUMN support_hours TEXT DEFAULT 'Business Hours';

-- Add comment to explain the field
COMMENT ON COLUMN public.vendors.support_hours IS 'Support availability hours (e.g., "24/7", "Business Hours", "9 AM - 5 PM EST")';

-- Update some existing vendors with sample data for demonstration
UPDATE public.vendors 
SET support_hours = '24/7' 
WHERE name ILIKE '%lender%' OR name ILIKE '%title%' OR name ILIKE '%insurance%';

UPDATE public.vendors 
SET support_hours = 'Business Hours' 
WHERE support_hours IS NULL;