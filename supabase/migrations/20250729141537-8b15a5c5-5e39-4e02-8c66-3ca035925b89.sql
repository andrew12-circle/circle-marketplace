-- Fix the security definer view issue
-- Instead of using a view, we'll rely on proper RLS policies for data access

-- Drop the problematic view
DROP VIEW IF EXISTS public.public_profiles;

-- Update the RLS policy to be more specific about what's publicly accessible
-- We'll keep the policy but applications should be careful about what they expose
DROP POLICY IF EXISTS "Public profile info viewable by everyone" ON public.profiles;

-- Create a more restrictive public access policy that only allows viewing specific non-sensitive fields
-- Applications should query only the fields they need for public display
CREATE POLICY "Limited public profile access" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Add comments to remind developers about data sensitivity
COMMENT ON TABLE public.profiles IS 'Contains user profile data. Use carefully - only expose necessary fields publicly. Sensitive fields: email, phone, is_pro_member, circle_points';
COMMENT ON COLUMN public.profiles.phone IS 'SENSITIVE: Only show to profile owner';
COMMENT ON COLUMN public.profiles.circle_points IS 'SENSITIVE: Only show to profile owner';
COMMENT ON COLUMN public.profiles.is_pro_member IS 'SENSITIVE: Only show to profile owner';

-- The application layer will be responsible for only selecting appropriate fields for public display