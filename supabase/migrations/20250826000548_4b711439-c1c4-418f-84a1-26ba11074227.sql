-- Fix duplicate profiles issue for Robert Padilla and prevent future duplicates

-- First, let's see current duplicate profiles
-- SELECT user_id, COUNT(*) as profile_count, string_agg(id::text, ', ') as profile_ids
-- FROM public.profiles 
-- GROUP BY user_id 
-- HAVING COUNT(*) > 1;

-- Step 1: Remove duplicate profiles, keeping the one with is_admin=true or the newest one
WITH duplicate_profiles AS (
  SELECT 
    user_id,
    id,
    is_admin,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY 
        is_admin DESC NULLS LAST,  -- Prefer admin profiles
        created_at DESC             -- Then prefer newest
    ) as rn
  FROM public.profiles
  WHERE user_id IN (
    SELECT user_id 
    FROM public.profiles 
    GROUP BY user_id 
    HAVING COUNT(*) > 1
  )
),
profiles_to_delete AS (
  SELECT id 
  FROM duplicate_profiles 
  WHERE rn > 1
)
DELETE FROM public.profiles 
WHERE id IN (SELECT id FROM profiles_to_delete);

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Step 3: Create a function to safely fetch single profile (for frontend use)
CREATE OR REPLACE FUNCTION public.get_user_profile_safe(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  is_admin boolean,
  is_verified boolean,
  is_pro boolean,
  is_creator boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    p.is_admin,
    p.is_verified,
    p.is_pro,
    p.is_creator,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = p_user_id
  LIMIT 1;  -- Safety limit in case constraint isn't applied yet
END;
$function$;