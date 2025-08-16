-- Fix the security definer function search path
CREATE OR REPLACE FUNCTION public.auto_create_vendor_record()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  -- Only create vendor record if user doesn't already have one
  IF NOT EXISTS (SELECT 1 FROM public.vendors WHERE id = NEW.id) THEN
    INSERT INTO public.vendors (
      id, 
      name, 
      contact_email,
      approval_status,
      is_active,
      is_verified,
      auto_score
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'name', 'New Vendor'),
      NEW.email,
      'pending',
      false,
      false,
      0
    );
  END IF;
  RETURN NEW;
END;
$$;