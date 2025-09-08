-- Create initial point allocations for users who have circle_points but no allocations
-- This fixes the issue where new users get 100 points in profile but no allocation records

INSERT INTO public.point_allocations (
  agent_id,
  vendor_id,
  allocated_points,
  remaining_points,
  used_points,
  status,
  allocation_period,
  start_date,
  end_date,
  notes,
  created_by
)
SELECT 
  p.user_id as agent_id,
  '00000000-0000-0000-0000-000000000001'::uuid as vendor_id, -- System user
  p.circle_points as allocated_points,
  p.circle_points as remaining_points,
  0 as used_points,
  'active' as status,
  'welcome_bonus' as allocation_period,
  CURRENT_DATE as start_date,
  CURRENT_DATE + INTERVAL '1 year' as end_date,
  'Initial welcome bonus points' as notes,
  '00000000-0000-0000-0000-000000000001'::uuid as created_by
FROM public.profiles p
WHERE p.circle_points > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.point_allocations pa 
    WHERE pa.agent_id = p.user_id
  );