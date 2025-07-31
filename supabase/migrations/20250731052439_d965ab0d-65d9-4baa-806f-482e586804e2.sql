-- Add sorting order field to services table
ALTER TABLE public.services 
ADD COLUMN sort_order integer DEFAULT 50;

-- Add index for better performance when sorting
CREATE INDEX idx_services_sort_order ON public.services(sort_order);

-- Update existing services to have default sort order of 50
UPDATE public.services 
SET sort_order = 50 
WHERE sort_order IS NULL;