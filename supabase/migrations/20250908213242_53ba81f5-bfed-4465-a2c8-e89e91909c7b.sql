-- Remove circle points and allocations for non-pro users
-- Only pro members should have the welcome bonus

-- First, remove point allocations for non-pro users
DELETE FROM public.point_allocations 
WHERE allocation_period = 'welcome_bonus'
  AND agent_id NOT IN (
    SELECT user_id FROM public.profiles 
    WHERE is_pro = true OR is_pro_member = true
  );

-- Reset circle_points to 0 for non-pro users
UPDATE public.profiles 
SET circle_points = 0 
WHERE (is_pro = false OR is_pro IS NULL) 
  AND (is_pro_member = false OR is_pro_member IS NULL)
  AND circle_points > 0;

-- Create a function to award points when user becomes pro
CREATE OR REPLACE FUNCTION public.award_pro_member_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user just became pro (either is_pro or is_pro_member changed to true)
  IF (OLD.is_pro = false OR OLD.is_pro IS NULL) AND NEW.is_pro = true THEN
    -- Award 100 circle points
    NEW.circle_points = COALESCE(NEW.circle_points, 0) + 100;
    
    -- Create point allocation record
    INSERT INTO public.point_allocations (
      agent_id,
      vendor_id,
      allocated_points,
      used_points,
      status,
      allocation_period,
      start_date,
      end_date,
      notes,
      created_by
    ) VALUES (
      NEW.user_id,
      '00000000-0000-0000-0000-000000000001'::uuid, -- System user
      100,
      0,
      'active',
      'pro_member_bonus',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 year',
      'Pro member welcome bonus - 100 Circle Points',
      '00000000-0000-0000-0000-000000000001'::uuid
    );
  END IF;
  
  -- Similar check for is_pro_member
  IF (OLD.is_pro_member = false OR OLD.is_pro_member IS NULL) AND NEW.is_pro_member = true THEN
    -- Award 100 circle points (if not already awarded via is_pro)
    IF NEW.circle_points = COALESCE(OLD.circle_points, 0) THEN
      NEW.circle_points = COALESCE(NEW.circle_points, 0) + 100;
      
      -- Create point allocation record
      INSERT INTO public.point_allocations (
        agent_id,
        vendor_id,
        allocated_points,
        used_points,
        status,
        allocation_period,
        start_date,
        end_date,
        notes,
        created_by
      ) VALUES (
        NEW.user_id,
        '00000000-0000-0000-0000-000000000001'::uuid, -- System user
        100,
        0,
        'active',
        'pro_member_bonus',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '1 year',
        'Pro member welcome bonus - 100 Circle Points',
        '00000000-0000-0000-0000-000000000001'::uuid
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to award points when user becomes pro
DROP TRIGGER IF EXISTS award_pro_points_trigger ON public.profiles;
CREATE TRIGGER award_pro_points_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.award_pro_member_points();