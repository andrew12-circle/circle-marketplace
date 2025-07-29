-- Add new pricing fields to services table
ALTER TABLE public.services 
ADD COLUMN retail_price text,
ADD COLUMN pro_price text,
ADD COLUMN co_pay_price text;

-- Update existing services with sample pricing data
UPDATE public.services 
SET 
  retail_price = (CAST(price AS DECIMAL) * 1.5)::text,
  pro_price = price,
  co_pay_price = (CAST(price AS DECIMAL) * 0.2)::text
WHERE price IS NOT NULL AND price != '';