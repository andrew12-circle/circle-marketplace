-- Create agent profile for Andrew Heisley
INSERT INTO public.agents (
  user_id,
  email,
  first_name,
  last_name,
  phone,
  brokerage,
  city,
  state,
  years_active,
  is_active
) VALUES (
  '11ea4b95-676e-48cf-83ba-0b6977b4b7cf',
  'andrew@heisleyteam.com',
  'Andrew',
  'Heisley',
  '555-0123',
  'Heisley Team Realty',
  'Nashville',
  'TN',
  8,
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  brokerage = EXCLUDED.brokerage,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  years_active = EXCLUDED.years_active,
  is_active = EXCLUDED.is_active;