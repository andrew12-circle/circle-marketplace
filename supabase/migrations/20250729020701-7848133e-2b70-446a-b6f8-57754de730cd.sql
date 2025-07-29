-- Create user profiles table with additional fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing orders to link with profiles for better tracking
-- (This is safe to run even if no orders exist yet)