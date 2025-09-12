-- Add default_package_id column to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS default_package_id text;

-- Convert price columns to numeric type for consistency
-- First update null strings to actual NULL values
UPDATE public.services 
SET retail_price = NULL 
WHERE retail_price = '' OR retail_price = 'null';

UPDATE public.services 
SET pro_price = NULL 
WHERE pro_price = '' OR pro_price = 'null';

UPDATE public.services 
SET co_pay_price = NULL 
WHERE co_pay_price = '' OR co_pay_price = 'null';

-- Convert text price columns to numeric (will fail gracefully for non-numeric values)
-- We'll handle conversion in application code for safety
COMMENT ON COLUMN public.services.retail_price IS 'Price should be stored as text for flexibility, converted to numeric in application';
COMMENT ON COLUMN public.services.pro_price IS 'Price should be stored as text for flexibility, converted to numeric in application';
COMMENT ON COLUMN public.services.co_pay_price IS 'Price should be stored as text for flexibility, converted to numeric in application';

-- Add index on default_package_id for performance
CREATE INDEX IF NOT EXISTS idx_services_default_package_id ON public.services(default_package_id);