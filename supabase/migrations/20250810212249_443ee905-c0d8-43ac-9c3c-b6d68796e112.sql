-- Insert sample service reviews for testing the funnel review system
-- Using correct review_source values from the constraint

INSERT INTO public.service_reviews (
  service_id,
  user_id,
  rating,
  review,
  verified,
  review_source,
  created_at
) VALUES 
(
  (SELECT id FROM public.services LIMIT 1), -- Gets first service
  '00000000-0000-0000-0000-000000000001'::uuid,
  5,
  'This service completely transformed my marketing approach. Saw a 150% increase in qualified leads within the first month. The team was professional and delivered exactly what they promised.',
  true,
  'agent', -- Using valid review_source
  '2025-01-15 10:30:00'::timestamp with time zone
),
(
  (SELECT id FROM public.services LIMIT 1),
  '00000000-0000-0000-0000-000000000002'::uuid,
  5,
  'Outstanding ROI and excellent customer service. The implementation was smooth and the results exceeded my expectations. Highly recommend for any serious real estate professional.',
  true,
  'agent',
  '2024-12-22 14:15:00'::timestamp with time zone
),
(
  (SELECT id FROM public.services LIMIT 1),
  '00000000-0000-0000-0000-000000000003'::uuid,
  4,
  'Great service overall with solid results. The only minor issue was initial setup took longer than expected, but support was very helpful throughout.',
  true,
  'agent',
  '2024-11-30 09:45:00'::timestamp with time zone
),
(
  (SELECT id FROM public.services LIMIT 1),
  '00000000-0000-0000-0000-000000000004'::uuid,
  5,
  'Exceptional value and results. The lead generation tools alone paid for themselves within 3 weeks. Customer support is top-notch and always responsive.',
  true,
  'vendor_provided',
  '2024-11-15 16:20:00'::timestamp with time zone
),
(
  (SELECT id FROM public.services LIMIT 1),
  '00000000-0000-0000-0000-000000000005'::uuid,
  4,
  'Solid service with measurable results. The analytics dashboard is particularly useful for tracking campaign performance. Would definitely recommend to other agents.',
  true,
  'google_external',
  '2024-10-28 11:10:00'::timestamp with time zone
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
),
(
  '00000000-0000-0000-0000-000000000004'::uuid,
  'Michael Rodriguez',
  'RE/MAX Champions',
  ARRAY['realtor', 'commercial'],
  now()
),
(
  '00000000-0000-0000-0000-000000000005'::uuid,
  'Sarah Williams',
  'Coldwell Banker Premier',
  ARRAY['realtor', 'luxury'],
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  business_name = EXCLUDED.business_name,
  specialties = EXCLUDED.specialties;