-- Update max_split_percentage_ssp and max_split_percentage_non_ssp to 50% to fix "Not eligible" display
UPDATE services 
SET max_split_percentage_ssp = 50,
    max_split_percentage_non_ssp = 50
WHERE max_split_percentage_ssp = 0 OR max_split_percentage_ssp IS NULL OR max_split_percentage_non_ssp = 0 OR max_split_percentage_non_ssp IS NULL;