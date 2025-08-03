-- Add RESPA compliance fields to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS is_respa_regulated boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS respa_risk_level text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS respa_compliance_notes text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_split_percentage integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS compliance_checklist jsonb DEFAULT NULL;