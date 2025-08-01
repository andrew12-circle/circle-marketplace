-- Fix privilege escalation with a simpler approach
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can update basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can update security fields" ON public.profiles;

-- Create a comprehensive policy that allows users to update only safe fields
CREATE POLICY "Users can update non-security fields only" ON public.profiles
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  (
    -- Allow admins to update everything
    get_user_admin_status() = true OR
    -- For non-admins, only allow updates where security fields remain unchanged
    (
      is_admin = (SELECT is_admin FROM profiles WHERE user_id = auth.uid()) AND
      creator_verified = (SELECT creator_verified FROM profiles WHERE user_id = auth.uid()) AND
      specialties = (SELECT specialties FROM profiles WHERE user_id = auth.uid()) AND
      revenue_share_percentage = (SELECT revenue_share_percentage FROM profiles WHERE user_id = auth.uid()) AND
      total_earnings = (SELECT total_earnings FROM profiles WHERE user_id = auth.uid()) AND
      bank_details = (SELECT bank_details FROM profiles WHERE user_id = auth.uid()) AND
      creator_joined_at = (SELECT creator_joined_at FROM profiles WHERE user_id = auth.uid())
    )
  )
);