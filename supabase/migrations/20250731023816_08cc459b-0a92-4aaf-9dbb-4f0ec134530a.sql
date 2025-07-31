-- Remove unused price columns from services table
ALTER TABLE public.services DROP COLUMN IF EXISTS price;
ALTER TABLE public.services DROP COLUMN IF EXISTS original_price;