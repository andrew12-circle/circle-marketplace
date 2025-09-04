-- Remove vendor_id from services table to make services independent platform offerings
ALTER TABLE public.services DROP COLUMN IF EXISTS vendor_id;