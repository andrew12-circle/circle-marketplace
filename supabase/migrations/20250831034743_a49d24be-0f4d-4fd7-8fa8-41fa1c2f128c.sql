-- Update Hello Leverage service with proper category tags
UPDATE public.services 
SET tags = ARRAY['cat:productivity', 'cat:finance-business', 'cat:virtual-assistants', 'business', 'coordination', 'efficiency']
WHERE title = 'Hello Leverage';