-- Add new columns for dual coverage logic
ALTER TABLE public.services 
  ADD COLUMN IF NOT EXISTS ssp_allowed boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_split_percentage_ssp integer DEFAULT 0;

-- Add constraints for percentage validation (without IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_ssp_pct_chk') THEN
    ALTER TABLE public.services 
    ADD CONSTRAINT services_ssp_pct_chk
    CHECK (
      max_split_percentage_ssp IS NULL 
      OR (max_split_percentage_ssp >= 0 AND max_split_percentage_ssp <= 100)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_non_ssp_pct_chk') THEN
    ALTER TABLE public.services 
    ADD CONSTRAINT services_non_ssp_pct_chk
    CHECK (
      max_split_percentage_non_ssp IS NULL 
      OR (max_split_percentage_non_ssp >= 0 AND max_split_percentage_non_ssp <= 100)
    );
  END IF;
END $$;

-- Create function to enforce SSP block
CREATE OR REPLACE FUNCTION enforce_ssp_block()
RETURNS trigger AS $$
BEGIN
  IF NEW.ssp_allowed = false THEN
    NEW.max_split_percentage_ssp := 0;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_enforce_ssp_block ON public.services;
CREATE TRIGGER trg_enforce_ssp_block
BEFORE INSERT OR UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION enforce_ssp_block();

-- Set AgentUp configuration
UPDATE public.services
SET ssp_allowed = false,
    max_split_percentage_ssp = 0,
    max_split_percentage_non_ssp = 100
WHERE LOWER(title) LIKE '%agentup%';