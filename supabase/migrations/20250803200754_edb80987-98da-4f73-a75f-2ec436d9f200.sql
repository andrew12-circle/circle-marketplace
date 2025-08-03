-- Add RESPA compliance limit fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN respa_max_copay_percentage INTEGER DEFAULT NULL,
ADD COLUMN respa_service_categories TEXT[] DEFAULT NULL,
ADD COLUMN respa_notes TEXT DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.respa_max_copay_percentage IS 'Maximum co-pay percentage allowed for this vendor based on RESPA compliance (NULL = no limit for non-settlement providers)';
COMMENT ON COLUMN public.profiles.respa_service_categories IS 'Array of service categories this vendor provides that are subject to RESPA';
COMMENT ON COLUMN public.profiles.respa_notes IS 'Admin notes about RESPA compliance requirements for this vendor';