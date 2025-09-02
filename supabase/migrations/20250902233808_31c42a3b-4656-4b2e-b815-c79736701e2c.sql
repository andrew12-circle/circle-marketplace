-- Update Robert Padilla's profile to have is_pro_member = true since is_pro is already true
-- This fixes the mismatch between admin interface and UI display
UPDATE public.profiles 
SET is_pro_member = true 
WHERE user_id = '16996de6-7480-4d8d-aa37-97b2e9a4aada' AND is_pro = true;