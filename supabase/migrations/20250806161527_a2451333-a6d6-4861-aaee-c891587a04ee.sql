-- Add is_verified field to services table
ALTER TABLE public.services 
ADD COLUMN is_verified boolean DEFAULT false;