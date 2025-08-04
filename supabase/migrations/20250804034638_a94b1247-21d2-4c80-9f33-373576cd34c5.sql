-- Remove the old max_vendor_split_percentage column and keep only SSP/non-SSP fields
ALTER TABLE public.services DROP COLUMN IF EXISTS max_vendor_split_percentage;

-- Ensure we have the correct SSP and non-SSP columns (add if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' 
                 AND column_name = 'max_split_percentage_ssp') THEN
    ALTER TABLE public.services ADD COLUMN max_split_percentage_ssp INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' 
                 AND column_name = 'max_split_percentage_non_ssp') THEN
    ALTER TABLE public.services ADD COLUMN max_split_percentage_non_ssp INTEGER;
  END IF;
END $$;