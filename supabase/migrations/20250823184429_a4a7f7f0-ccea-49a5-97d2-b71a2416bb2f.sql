-- Remove the view to fix security definer issue
DROP VIEW IF EXISTS public.public_agent_listings;

-- The agents table is now properly secured with these policies:
-- 1. "Users can view their own agent profile" - allows agents to see their own data
-- 2. "Admins can view all agent profiles" - allows admins to see all data
-- 3. "Users can insert their own agent profile" - allows profile creation  
-- 4. "Users can update their own agent profile" - allows profile updates

-- For any public listings functionality in the application, 
-- the frontend should use filtered queries that only request non-sensitive fields
-- or implement separate public-facing tables if needed

-- No public access to the main agents table containing sensitive data like:
-- email, phone, address, nmls_id