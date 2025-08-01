-- Add pricing_tiers JSONB column to services table
ALTER TABLE public.services 
ADD COLUMN pricing_tiers JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.services.pricing_tiers IS 'Array of pricing tier objects with name, description, price, features, and popularity flags';

-- Update RLS policy to allow service creators to update their own services
DROP POLICY IF EXISTS "Only admins can update services" ON public.services;

CREATE POLICY "Service creators can update their own services"
ON public.services
FOR UPDATE
USING (auth.uid() = vendor_id OR get_user_admin_status());

-- Update RLS policy to allow service creators to insert their own services  
DROP POLICY IF EXISTS "Only admins can insert services" ON public.services;

CREATE POLICY "Service creators can insert their own services"
ON public.services
FOR INSERT
WITH CHECK (auth.uid() = vendor_id OR get_user_admin_status());