-- Update TremGroup pricing data to match desired pro member display
UPDATE public.services 
SET 
  retail_price = '749',
  pro_price = '749',
  requires_quote = false,
  respa_split_limit = 30,
  pricing_tiers = jsonb_build_array(
    jsonb_build_object(
      'id', 'standard',
      'label', 'Standard Package',
      'price', 749,
      'pro_price', 749,
      'description', 'Complete marketing package'
    )
  )
WHERE company = 'TremGroup' 
  AND title ILIKE '%marketing%';