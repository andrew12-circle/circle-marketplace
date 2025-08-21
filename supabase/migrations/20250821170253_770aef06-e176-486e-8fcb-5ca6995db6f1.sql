-- Update services to be active so they show in the marketplace
UPDATE services 
SET is_active = true 
WHERE is_active = false OR is_active IS NULL;

-- Also ensure all services have proper sort_order for consistent display
UPDATE services 
SET sort_order = COALESCE(sort_order, 1)
WHERE sort_order IS NULL;