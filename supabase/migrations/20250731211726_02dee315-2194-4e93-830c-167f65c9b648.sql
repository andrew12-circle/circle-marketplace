-- Add ad budget field to vendors table
ALTER TABLE public.vendors 
ADD COLUMN ad_budget_min integer DEFAULT NULL,
ADD COLUMN ad_budget_max integer DEFAULT NULL,
ADD COLUMN budget_currency text DEFAULT 'USD';

-- Add index for budget filtering
CREATE INDEX idx_vendors_budget ON public.vendors(ad_budget_min, ad_budget_max);

-- Add comments for clarity
COMMENT ON COLUMN public.vendors.ad_budget_min IS 'Minimum monthly ad budget in cents';
COMMENT ON COLUMN public.vendors.ad_budget_max IS 'Maximum monthly ad budget in cents'; 
COMMENT ON COLUMN public.vendors.budget_currency IS 'Currency code for budget amounts';