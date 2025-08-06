-- Remove the redundant vendor split percentage column
ALTER TABLE public.services DROP COLUMN IF EXISTS max_split_percentage_ssp;

-- Rename max_split_percentage to be clearer about its purpose
ALTER TABLE public.services RENAME COLUMN max_split_percentage TO respa_split_limit;