-- Add profile picture URL column for individual representatives in vendors table
ALTER TABLE public.vendors 
ADD COLUMN individual_profile_picture_url TEXT;

-- Update Andrew Heisley's record at Circle Home Loans with a profile picture
UPDATE public.vendors 
SET individual_profile_picture_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
WHERE company_name = 'Circle Home Loans' 
AND individual_name = 'Andrew Heisley';