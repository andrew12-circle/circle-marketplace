-- Create a system user profile for YouTube imports
INSERT INTO profiles (
  id,
  user_id, 
  display_name,
  business_name,
  is_creator,
  creator_verified,
  creator_joined_at,
  circle_points,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'Circle Academy',
  'Circle Academy Official',
  true,
  true,
  now(),
  0,
  now(),
  now()
) ON CONFLICT (user_id) DO NOTHING;