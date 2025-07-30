-- Add price_duration column to services table
ALTER TABLE public.services 
ADD COLUMN price_duration text DEFAULT 'mo';

-- Add helpful comment
COMMENT ON COLUMN public.services.price_duration IS 'Billing cycle for the service pricing (mo, yr, one-time, etc.)';