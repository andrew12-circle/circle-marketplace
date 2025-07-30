-- Check and fix any remaining SECURITY DEFINER functions

-- Update all existing functions to ensure proper security settings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, circle_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    100  -- Welcome bonus points
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_saved_services_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  radius DECIMAL := 3959; -- Earth radius in miles
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN radius * c;
END;
$$;