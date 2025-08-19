-- Add missing columns to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 0;

-- Update any existing NULL values  
UPDATE public.services 
SET is_published = true 
WHERE is_published IS NULL;

UPDATE public.services 
SET average_rating = 0 
WHERE average_rating IS NULL;