
-- 1) Add a column to store "Time to Setup" for services
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS setup_time text;

-- Optional: add a helpful description
COMMENT ON COLUMN public.services.setup_time IS 'Estimated time required to set up the service (e.g., "2–3 days").';
