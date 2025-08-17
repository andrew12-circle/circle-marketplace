-- Add sponsored placement columns to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sponsored_rank_boost INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_services_sponsored ON public.services(is_sponsored, sponsored_rank_boost) WHERE is_sponsored = TRUE;