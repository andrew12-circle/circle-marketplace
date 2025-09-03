-- Add RESPA compliance columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_respa_regulated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS respa_risk_level TEXT CHECK (respa_risk_level IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS respa_max_copay_percentage INTEGER CHECK (respa_max_copay_percentage >= 0 AND respa_max_copay_percentage <= 100),
ADD COLUMN IF NOT EXISTS respa_service_categories TEXT[],
ADD COLUMN IF NOT EXISTS respa_notes TEXT;

-- Create index for RESPA compliance queries
CREATE INDEX IF NOT EXISTS idx_profiles_respa_regulated ON public.profiles(is_respa_regulated) WHERE is_respa_regulated = true;

-- Comment on the new columns
COMMENT ON COLUMN public.profiles.is_respa_regulated IS 'Whether this vendor is subject to RESPA regulations';
COMMENT ON COLUMN public.profiles.respa_risk_level IS 'RESPA compliance risk level: low, medium, high';
COMMENT ON COLUMN public.profiles.respa_max_copay_percentage IS 'Maximum co-pay percentage allowed for this vendor under RESPA';
COMMENT ON COLUMN public.profiles.respa_service_categories IS 'Array of service categories that are RESPA regulated for this vendor';
COMMENT ON COLUMN public.profiles.respa_notes IS 'Admin notes about RESPA compliance for this vendor';