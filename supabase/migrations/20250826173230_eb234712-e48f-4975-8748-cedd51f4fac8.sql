-- Fix infinite recursion in profiles table RLS policies
-- Drop existing problematic policies and recreate them safely

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own basic profile" ON public.profiles;

-- Create safe policies without recursion
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Admin policies that check the allowlist from the application code
-- For Robert's email specifically hardcoded to avoid recursion
CREATE POLICY "Hardcoded admin can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (is_admin = true OR 'admin' = ANY(specialties))
    LIMIT 1
  ) OR
  -- Hardcoded allowlist for Robert
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'robert@circlenetwork.io'
  )
);

CREATE POLICY "Hardcoded admin can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id OR
  -- Hardcoded allowlist for Robert
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'robert@circlenetwork.io'
  )
);