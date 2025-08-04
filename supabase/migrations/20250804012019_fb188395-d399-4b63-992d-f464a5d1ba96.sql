-- Add new columns for separate SSP and Non-SSP split percentages
ALTER TABLE public.services 
ADD COLUMN max_split_percentage_ssp INTEGER,
ADD COLUMN max_split_percentage_non_ssp INTEGER;

-- Update existing services to have default values
-- For now, set non-SSP to 100% (no limit) and SSP to existing max_split_percentage
UPDATE public.services 
SET 
  max_split_percentage_non_ssp = 100,
  max_split_percentage_ssp = COALESCE(max_split_percentage, 50)
WHERE max_split_percentage_ssp IS NULL;