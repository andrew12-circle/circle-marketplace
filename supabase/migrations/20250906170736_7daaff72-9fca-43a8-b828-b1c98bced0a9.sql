-- Create Circle Advisory Service for consultation bookings with proper UUID
INSERT INTO public.services (
  id,
  title,
  description,
  category,
  retail_price,
  pro_price,
  duration,
  is_featured,
  is_top_pick,
  tags,
  image_url,
  created_at,
  updated_at,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Circle Marketplace Advisory Consultation',
  'Get personalized guidance from the Circle Marketplace team. We''ll help you find the right vendors, understand pricing, and make informed decisions for your real estate business. This complimentary 15-minute consultation ensures you get the most value from our marketplace.',
  'Consulting & Advisory',
  'FREE',
  'FREE',
  '15 minutes',
  false,
  false,
  ARRAY['consultation', 'advisory', 'free', 'circle team', 'guidance'],
  '/placeholder.svg',
  now(),
  now(),
  true
);