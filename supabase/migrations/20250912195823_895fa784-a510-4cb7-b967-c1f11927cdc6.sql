-- Update all services with 0 respa_split_limit to 50% to enable pricing display
UPDATE services 
SET respa_split_limit = 50 
WHERE respa_split_limit = 0 OR respa_split_limit IS NULL;

-- Also set copay_allowed to true for services that don't have it set
UPDATE services 
SET copay_allowed = true 
WHERE copay_allowed IS NULL OR copay_allowed = false;