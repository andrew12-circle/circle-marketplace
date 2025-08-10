-- 1) Add funnel_content column to services and index for reads
-- Use JSONB nullable with no CHECK constraints; add updated_at trigger reuse if exists

-- Create column if not exists (idempotent pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'funnel_content'
  ) THEN
    ALTER TABLE public.services ADD COLUMN funnel_content jsonb;
  END IF;
END $$;

-- Ensure pricing_tiers column exists as jsonb[] or jsonb, but do not alter if present
-- Leave as-is to avoid breaking existing code

-- Optional index to speed up reads by id and existence checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'services_funnel_content_gin' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX services_funnel_content_gin ON public.services USING GIN (funnel_content);
  END IF;
END $$;

-- No RLS change needed; services already governed by existing policies
-- Update updated_at trigger left intact if table already has it
