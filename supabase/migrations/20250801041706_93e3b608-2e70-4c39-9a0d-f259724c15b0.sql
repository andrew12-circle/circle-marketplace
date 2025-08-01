-- Create or replace the handle_new_user function to include GHL contact creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  contact_data jsonb;
BEGIN
  -- Insert the profile as before
  INSERT INTO public.profiles (user_id, display_name, circle_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    100  -- Welcome bonus points
  );

  -- Prepare contact data for GHL
  contact_data := jsonb_build_object(
    'firstName', COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    'lastName', COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'email', NEW.email,
    'phone', NEW.raw_user_meta_data->>'phone',
    'tags', jsonb_build_array('New User', 'Platform Signup'),
    'customFields', jsonb_build_object(
      'platform_source', 'Circle Platform User Registration',
      'signup_date', now()::text,
      'user_id', NEW.id::text,
      'signup_method', COALESCE(NEW.raw_user_meta_data->>'provider', 'email')
    )
  );

  -- Call GHL contact creation function (non-blocking)
  BEGIN
    PERFORM net.http_post(
      url := 'https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/create-ghl-contact',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
      ),
      body := contact_data
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'Failed to create GHL contact for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Create a function to handle profile updates for role-specific GHL contacts
CREATE OR REPLACE FUNCTION public.handle_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  contact_data jsonb;
  user_data record;
  role_tags text[];
BEGIN
  -- Only proceed if this is a role-related change
  IF (OLD.specialties IS DISTINCT FROM NEW.specialties) OR 
     (OLD.vendor_enabled IS DISTINCT FROM NEW.vendor_enabled) OR
     (OLD.is_creator IS DISTINCT FROM NEW.is_creator) THEN

    -- Get user auth data
    SELECT email, raw_user_meta_data
    INTO user_data
    FROM auth.users
    WHERE id = NEW.user_id;

    -- Determine role-specific tags
    role_tags := ARRAY['Platform User'];
    
    IF NEW.vendor_enabled = true THEN
      role_tags := role_tags || ARRAY['Vendor', 'Service Provider'];
    END IF;
    
    IF NEW.is_creator = true THEN
      role_tags := role_tags || ARRAY['Creator', 'Content Provider'];
    END IF;
    
    IF 'realtor' = ANY(NEW.specialties) OR 'real_estate' = ANY(NEW.specialties) THEN
      role_tags := role_tags || ARRAY['Realtor', 'Real Estate Professional'];
    END IF;
    
    IF 'marketing' = ANY(NEW.specialties) THEN
      role_tags := role_tags || ARRAY['Marketing Professional'];
    END IF;
    
    IF 'settlement' = ANY(NEW.specialties) OR 'title' = ANY(NEW.specialties) THEN
      role_tags := role_tags || ARRAY['Settlement Professional', 'Title Professional'];
    END IF;

    -- Prepare enhanced contact data
    contact_data := jsonb_build_object(
      'firstName', COALESCE(NEW.display_name, split_part(user_data.email, '@', 1)),
      'lastName', '',
      'email', user_data.email,
      'phone', COALESCE(NEW.phone, user_data.raw_user_meta_data->>'phone'),
      'companyName', NEW.business_name,
      'website', NEW.website_url,
      'address1', NEW.location,
      'city', NEW.city,
      'state', NEW.state,
      'postalCode', NEW.zip_code,
      'tags', to_jsonb(role_tags),
      'customFields', jsonb_build_object(
        'platform_source', 'Circle Platform Role Update',
        'user_id', NEW.user_id::text,
        'role_update_date', now()::text,
        'specialties', to_jsonb(NEW.specialties),
        'years_experience', NEW.years_experience,
        'is_vendor', NEW.vendor_enabled,
        'is_creator', NEW.is_creator,
        'circle_points', NEW.circle_points,
        'business_name', NEW.business_name,
        'bio', NEW.bio
      )
    );

    -- Call GHL contact creation/update function (non-blocking)
    BEGIN
      PERFORM net.http_post(
        url := 'https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/create-ghl-contact',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := contact_data
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail the profile update
        RAISE WARNING 'Failed to update GHL contact for user %: %', NEW.user_id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for profile role changes
DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_role_change();