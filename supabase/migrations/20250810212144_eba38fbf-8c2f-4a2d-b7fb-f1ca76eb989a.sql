-- Insert sample service reviews for testing the funnel review system

-- First, let's check if we have any services to attach reviews to
-- Insert sample reviews for the first available service

INSERT INTO public.service_reviews (
  service_id,
  user_id,
  rating,
  review,
  verified,
  review_source,
  created_at
) VALUES 
-- You'll need to replace 'YOUR_SERVICE_ID' with an actual service ID from your services table
-- and 'YOUR_USER_ID' with actual user IDs from your profiles/auth.users table

-- For now, using sample UUIDs - these will need to be updated with real IDs
(
  (SELECT id FROM public.services LIMIT 1), -- Gets first service
  '00000000-0000-0000-0000-000000000001'::uuid, -- System user or replace with real user
  5,
  'This service completely transformed my marketing approach. Saw a 150% increase in qualified leads within the first month. The team was professional and delivered exactly what they promised.',
  true,
  'platform',
  '2025-01-15 10:30:00'::timestamp with time zone
),
(
  (SELECT id FROM public.services LIMIT 1),
  '00000000-0000-0000-0000-000000000002'::uuid,
  5,
  'Outstanding ROI and excellent customer service. The implementation was smooth and the results exceeded my expectations. Highly recommend for any serious real estate professional.',
  true,
  'platform',
  '2024-12-22 14:15:00'::timestamp with time zone
),
(
  (SELECT id FROM public.services LIMIT 1),
  '00000000-0000-0000-0000-000000000003'::uuid,
  4,
  'Great service overall with solid results. The only minor issue was initial setup took longer than expected, but support was very helpful throughout.',
  true,
  'platform',
  '2024-11-30 09:45:00'::timestamp with time zone
);

-- Create sample profiles for the reviewers if they don't exist
INSERT INTO public.profiles (
  user_id,
  display_name,
  business_name,
  specialties,
  created_at
) VALUES 
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Jennifer Martinez',
  'Realty One Group',
  ARRAY['realtor', 'marketing'],
  now()
),
(
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Robert Chen',
  'Century 21 Elite',
  ARRAY['realtor', 'investment'],
  now()
),
(
  '00000000-0000-0000-0000-000000000003'::uuid,
  'Amanda Thompson',
  'Keller Williams Premier',
  ARRAY['realtor', 'residential'],
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  business_name = EXCLUDED.business_name,
  specialties = EXCLUDED.specialties;