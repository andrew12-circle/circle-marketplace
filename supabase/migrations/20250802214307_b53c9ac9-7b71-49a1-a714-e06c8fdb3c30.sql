-- Update default revenue share percentage to 25% for creators (Circle Network keeps 75%)
UPDATE public.profiles 
SET revenue_share_percentage = 25.00 
WHERE revenue_share_percentage = 75.00 OR revenue_share_percentage IS NULL;

-- Update creator analytics default share percentage
UPDATE public.creator_analytics 
SET creator_share_percentage = 25.00 
WHERE creator_share_percentage = 75.00 OR creator_share_percentage IS NULL;

-- Update monthly platform revenue default creator share
UPDATE public.monthly_platform_revenue 
SET creator_share_percentage = 25.00 
WHERE creator_share_percentage = 75.00 OR creator_share_percentage IS NULL;