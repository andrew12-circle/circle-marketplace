-- Fix the search path issue by setting it properly
CREATE OR REPLACE FUNCTION public.calculate_distance_miles(
  lat1 NUMERIC, lon1 NUMERIC, 
  lat2 NUMERIC, lon2 NUMERIC
) RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  r NUMERIC := 3959; -- Earth's radius in miles
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
  distance NUMERIC;
BEGIN
  -- Handle null coordinates
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN 999999; -- Return large distance for null coordinates
  END IF;
  
  -- Convert latitude and longitude from degrees to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  distance := r * c;
  
  RETURN distance;
END;
$$;