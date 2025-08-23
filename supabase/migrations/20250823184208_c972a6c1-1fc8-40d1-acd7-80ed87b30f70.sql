-- Fix the security definer view issue by removing it and using proper RLS policies instead

-- Drop the problematic security definer view
DROP VIEW IF EXISTS public.public_profiles;

-- Now we'll properly restrict the profiles table access using RLS only
-- Keep the existing secure policies and remove the overly permissive one

-- The profiles table should only be accessible to:
-- 1. Users viewing their own profile
-- 2. Admins viewing any profile
-- 3. No public access to the main profiles table

-- Remove the policy that allows any public access
DROP POLICY IF EXISTS "Public can view safe profile fields only" ON public.profiles;

-- Verify our secure policies are in place:
-- 1. "Users can view their own profile" - allows users to see their own data
-- 2. "Admins can view all profiles" - allows admins to see all data
-- 3. "Users can insert their own profile" - allows profile creation
-- 4. "Users can update their own profiles safely" - allows secure updates

-- These policies already exist and provide proper security without exposing sensitive data