-- Create missing profile records for Robert Padilla
INSERT INTO public.profiles (
  user_id,
  display_name,
  created_at,
  updated_at
) VALUES 
(
  '16996de6-7480-4d8d-aa37-97b2e9a4aada'::uuid,
  'Robert Padilla',
  '2025-07-31 16:40:53.895343+00'::timestamptz,
  now()
),
(
  '8559c5c1-25a5-4d53-9711-5c0f6e73513c'::uuid,
  'Robert Padilla',
  '2025-08-04 18:26:47.693169+00'::timestamptz,
  now()
)
ON CONFLICT (user_id) DO NOTHING;