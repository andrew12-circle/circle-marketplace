-- Add missing price_duration column to services table
ALTER TABLE public.services ADD COLUMN price_duration text DEFAULT 'mo';