-- Set all services to have 50% SSP split percentage
UPDATE public.services 
SET max_split_percentage_ssp = 50 
WHERE max_split_percentage_ssp IS NULL OR max_split_percentage_ssp != 50;