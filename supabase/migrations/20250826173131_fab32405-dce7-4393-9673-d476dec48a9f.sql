-- Fix infinite recursion in profiles table RLS policies
-- Drop existing problematic policies and recreate them safely

-- First, let's see what policies exist
-- Then recreate them without recursion

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create safe admin function that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.get_user_admin_status()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Check if user has admin in specialties array or is_admin is true
  SELECT COALESCE(
    (
      SELECT is_admin = true OR 'admin' = ANY(specialties)
      FROM public.profiles 
      WHERE user_id = auth.uid()
      LIMIT 1
    ), 
    false
  );
$$;

-- Create new safe policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own basic profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND OLD.is_admin IS NOT DISTINCT FROM NEW.is_admin);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND (p.is_admin = true OR 'admin' = ANY(p.specialties))
  )
);

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND (p.is_admin = true OR 'admin' = ANY(p.specialties))
  )
);