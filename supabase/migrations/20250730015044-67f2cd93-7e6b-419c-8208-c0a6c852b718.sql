-- Add is_admin column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_admin boolean DEFAULT false;

-- Update existing admin users based on specialties array
UPDATE public.profiles 
SET is_admin = true 
WHERE specialties @> ARRAY['admin'::text] OR 'admin' = ANY(specialties);

-- Create index for better performance on admin queries
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;