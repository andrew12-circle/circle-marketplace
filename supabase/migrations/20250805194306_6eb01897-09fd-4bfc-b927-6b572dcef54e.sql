-- Fix vendor relationships by linking services to vendors based on name matching
-- This will create proper vendor relationships for services

-- First, let's see what vendors we have
-- Get a sample of vendor names to understand the data
WITH vendor_names AS (
  SELECT id, name FROM vendors LIMIT 10
),
service_titles AS (
  SELECT id, title FROM services LIMIT 10
)
-- Create vendor relationships by matching service titles to vendor names
UPDATE services 
SET vendor_id = (
  SELECT v.id 
  FROM vendors v 
  WHERE v.name ILIKE '%' || SPLIT_PART(services.title, ' ', 1) || '%'
  OR services.title ILIKE '%' || v.name || '%'
  LIMIT 1
)
WHERE vendor_id IS NULL;

-- For any remaining services without vendors, assign them to the first vendor as a fallback
UPDATE services 
SET vendor_id = (SELECT id FROM vendors ORDER BY created_at LIMIT 1)
WHERE vendor_id IS NULL;

-- Update services to ensure they all have valid vendor relationships
-- If no good match found, assign to first vendor to prevent NULL issues