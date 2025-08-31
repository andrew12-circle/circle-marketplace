-- Add missing columns to services table for AI-generated content
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS disclaimer_content JSONB,
ADD COLUMN IF NOT EXISTS funnel_content JSONB,
ADD COLUMN IF NOT EXISTS pricing_tiers JSONB;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_services_disclaimer ON public.services USING GIN (disclaimer_content);
CREATE INDEX IF NOT EXISTS idx_services_funnel ON public.services USING GIN (funnel_content);
CREATE INDEX IF NOT EXISTS idx_services_pricing ON public.services USING GIN (pricing_tiers);