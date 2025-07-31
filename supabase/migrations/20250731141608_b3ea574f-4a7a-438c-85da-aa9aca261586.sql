-- Add sample data to test co-pay functionality
UPDATE public.services 
SET 
  co_pay_allowed = true,
  max_vendor_split_percentage = 50,
  estimated_agent_split_percentage = 50,
  respa_category = 'Advertising'
WHERE title ILIKE '%marketing%' OR title ILIKE '%advertising%' OR category = 'Marketing';

-- Update a few more services for testing
UPDATE public.services 
SET 
  co_pay_allowed = true,
  max_vendor_split_percentage = 25,
  estimated_agent_split_percentage = 75,
  respa_category = 'Software'
WHERE category = 'Technology' LIMIT 3;