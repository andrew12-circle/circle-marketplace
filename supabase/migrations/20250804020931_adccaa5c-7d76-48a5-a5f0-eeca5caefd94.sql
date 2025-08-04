-- Add is_pro column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_pro boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_pro IS 'Indicates if the user has pro membership privileges';