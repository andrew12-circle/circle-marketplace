-- Add ranking system to vendors table
ALTER TABLE public.vendors 
ADD COLUMN sort_order integer DEFAULT 50;

-- Add index for better performance when sorting by rank
CREATE INDEX idx_vendors_sort_order ON public.vendors(sort_order DESC);

-- Update existing vendors to have default ranking of 50
UPDATE public.vendors 
SET sort_order = 50 
WHERE sort_order IS NULL;