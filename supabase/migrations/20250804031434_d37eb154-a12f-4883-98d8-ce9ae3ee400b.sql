-- Add copay_allowed field to profiles table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'copay_allowed') THEN
    ALTER TABLE public.profiles ADD COLUMN copay_allowed boolean DEFAULT true;
  END IF;
END $$;

-- Set all existing records to have copay_allowed = true
UPDATE public.profiles SET copay_allowed = true WHERE copay_allowed IS NULL OR copay_allowed = false;

-- Add copay_allowed field to services table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'copay_allowed') THEN
    ALTER TABLE public.services ADD COLUMN copay_allowed boolean DEFAULT true;
  END IF;
END $$;

-- Set all existing services to have copay_allowed = true
UPDATE public.services SET copay_allowed = true WHERE copay_allowed IS NULL OR copay_allowed = false;