-- Add manual RESPA compliance fields to vendors table
ALTER TABLE public.vendors 
ADD COLUMN is_respa_regulated boolean DEFAULT NULL,
ADD COLUMN respa_risk_level text DEFAULT NULL CHECK (respa_risk_level IN ('high', 'medium', 'low'));

-- Add index for filtering
CREATE INDEX idx_vendors_respa ON public.vendors(is_respa_regulated, respa_risk_level);

-- Add comments for clarity
COMMENT ON COLUMN public.vendors.is_respa_regulated IS 'Manual override: true = RESPA regulated, false = Non-RESPA, null = use automatic detection';
COMMENT ON COLUMN public.vendors.respa_risk_level IS 'Manual risk level override: high, medium, or low';