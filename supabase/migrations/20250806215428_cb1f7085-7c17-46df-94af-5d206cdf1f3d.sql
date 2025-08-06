-- Remove unused image URL columns from services table
ALTER TABLE public.services DROP COLUMN IF EXISTS vectorized_image_url;
ALTER TABLE public.services DROP COLUMN IF EXISTS original_image_url;