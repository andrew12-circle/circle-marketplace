-- Add request_pricing field to services table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'request_pricing'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.services 
        ADD COLUMN request_pricing boolean DEFAULT false;
    END IF;
END $$;