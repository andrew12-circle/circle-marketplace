-- Fix the foreign key reference to point to profiles table instead of auth.users
ALTER TABLE public.ai_recommendation_log 
DROP CONSTRAINT IF EXISTS ai_recommendation_log_user_id_fkey;

-- Add proper foreign key to profiles table
ALTER TABLE public.ai_recommendation_log 
ADD CONSTRAINT ai_recommendation_log_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;