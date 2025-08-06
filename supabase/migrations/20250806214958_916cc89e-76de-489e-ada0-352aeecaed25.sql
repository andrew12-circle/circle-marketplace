-- Remove unused columns from services table
ALTER TABLE public.services DROP COLUMN IF EXISTS estimated_agent_split_percentage;
ALTER TABLE public.services DROP COLUMN IF EXISTS respa_category;
ALTER TABLE public.services DROP COLUMN IF EXISTS respa_notes;