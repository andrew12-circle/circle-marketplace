-- Remove the business directory view since it's causing security definer warnings
-- We'll rely on the secure function for business partner access instead

DROP VIEW IF EXISTS agents_business_directory CASCADE;