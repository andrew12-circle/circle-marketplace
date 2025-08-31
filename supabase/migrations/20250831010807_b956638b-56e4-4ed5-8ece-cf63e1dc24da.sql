-- Add profile image URL field to services table
ALTER TABLE public.services 
ADD COLUMN profile_image_url TEXT;