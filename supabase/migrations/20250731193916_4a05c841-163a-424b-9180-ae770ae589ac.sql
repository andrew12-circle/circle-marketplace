-- Add website_url column to services table
ALTER TABLE public.services 
ADD COLUMN website_url TEXT;