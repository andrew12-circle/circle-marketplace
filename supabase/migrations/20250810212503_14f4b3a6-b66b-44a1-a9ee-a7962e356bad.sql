-- Insert sample service reviews using actual user IDs from auth.users
-- Simplified version - just create reviews without touching profiles

WITH service_info AS (
  SELECT id as service_id FROM public.services LIMIT 1
),
user_info AS (
  SELECT id as user_id, ROW_NUMBER() OVER () as rn FROM auth.users LIMIT 5
)
INSERT INTO public.service_reviews (
  service_id,
  user_id,
  rating,
  review,
  verified,
  review_source,
  created_at
)
SELECT 
  s.service_id,
  u.user_id,
  CASE u.rn 
    WHEN 1 THEN 5
    WHEN 2 THEN 5
    WHEN 3 THEN 4
    WHEN 4 THEN 5
    WHEN 5 THEN 4
  END as rating,
  CASE u.rn
    WHEN 1 THEN 'This service completely transformed my marketing approach. Saw a 150% increase in qualified leads within the first month. The team was professional and delivered exactly what they promised.'
    WHEN 2 THEN 'Outstanding ROI and excellent customer service. The implementation was smooth and the results exceeded my expectations. Highly recommend for any serious real estate professional.'
    WHEN 3 THEN 'Great service overall with solid results. The only minor issue was initial setup took longer than expected, but support was very helpful throughout.'
    WHEN 4 THEN 'Exceptional value and results. The lead generation tools alone paid for themselves within 3 weeks. Customer support is top-notch and always responsive.'
    WHEN 5 THEN 'Solid service with measurable results. The analytics dashboard is particularly useful for tracking campaign performance. Would definitely recommend to other agents.'
  END as review,
  true as verified,
  CASE u.rn
    WHEN 1 THEN 'agent'
    WHEN 2 THEN 'agent'
    WHEN 3 THEN 'agent'
    WHEN 4 THEN 'vendor_provided'
    WHEN 5 THEN 'google_external'
  END as review_source,
  CASE u.rn
    WHEN 1 THEN '2025-01-15 10:30:00'::timestamp with time zone
    WHEN 2 THEN '2024-12-22 14:15:00'::timestamp with time zone
    WHEN 3 THEN '2024-11-30 09:45:00'::timestamp with time zone
    WHEN 4 THEN '2024-11-15 16:20:00'::timestamp with time zone
    WHEN 5 THEN '2024-10-28 11:10:00'::timestamp with time zone
  END as created_at
FROM service_info s
CROSS JOIN user_info u
WHERE s.service_id IS NOT NULL
ON CONFLICT (service_id, user_id) DO NOTHING;