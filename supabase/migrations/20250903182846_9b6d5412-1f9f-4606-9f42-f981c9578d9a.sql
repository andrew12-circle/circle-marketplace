
-- 1) Add pricing fields to services (section-level), preserving existing schema and RLS

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS pricing_mode text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS pricing_external_url text NULL,
  ADD COLUMN IF NOT EXISTS pricing_cta_label text NULL DEFAULT 'Get a custom quote',
  ADD COLUMN IF NOT EXISTS pricing_cta_type text NOT NULL DEFAULT 'quote',
  ADD COLUMN IF NOT EXISTS pricing_note text NULL;

-- 2) Enforce allowed values via CHECK constraints (idempotent-safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_pricing_mode_check'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_pricing_mode_check
      CHECK (pricing_mode IN ('auto','fixed','features_only','custom_quote','external_link'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_pricing_cta_type_check'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_pricing_cta_type_check
      CHECK (pricing_cta_type IN ('quote','consult','external'));
  END IF;
END$$;

-- Optional: basic URL sanity (kept permissive to avoid false positives)
-- You can add stronger validation later via application logic.
COMMENT ON COLUMN public.services.pricing_mode IS 'Controls funnel pricing rendering mode';
COMMENT ON COLUMN public.services.pricing_external_url IS 'External pricing URL for external_link mode';
COMMENT ON COLUMN public.services.pricing_cta_label IS 'CTA label for custom_quote or fallback';
COMMENT ON COLUMN public.services.pricing_cta_type IS 'CTA type (quote|consult|external)';
COMMENT ON COLUMN public.services.pricing_note IS 'Optional note for custom pricing panel';

