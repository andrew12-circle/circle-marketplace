-- Set andrew@circlenetwork.io as admin in profiles table
DO $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, is_admin, created_at, updated_at)
  SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'name', email), 
    true,
    now(),
    now()
  FROM auth.users 
  WHERE email = 'andrew@circlenetwork.io'
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    is_admin = true,
    updated_at = now();
    
  INSERT INTO public.profiles (user_id, display_name, is_admin, created_at, updated_at)
  SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'name', email), 
    true,
    now(),
    now()
  FROM auth.users 
  WHERE email = 'andrew@heisleyteam.com'
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    is_admin = true,
    updated_at = now();
END $$;