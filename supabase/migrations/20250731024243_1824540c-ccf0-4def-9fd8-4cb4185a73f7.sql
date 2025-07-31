-- Remove unused contribution_amount column from services table
ALTER TABLE public.services DROP COLUMN IF EXISTS contribution_amount;