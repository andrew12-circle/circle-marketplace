-- Fix the estimated_roi column to allow values up to 1000
ALTER TABLE services 
ALTER COLUMN estimated_roi TYPE NUMERIC(6,2);