-- Add direct purchase control field for vendors
ALTER TABLE public.services 
ADD COLUMN direct_purchase_enabled BOOLEAN DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN public.services.direct_purchase_enabled IS 'Allows vendors to enable/disable direct purchase bypassing consultation flow';