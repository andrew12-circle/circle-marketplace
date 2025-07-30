-- Phase 1: Fix Admin Access Control
-- Create security definer function to prevent infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_user_admin_status()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Create function to check if user has specific specialty
CREATE OR REPLACE FUNCTION public.user_has_specialty(specialty_name text)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (specialties @> ARRAY[specialty_name] OR specialty_name = ANY(specialties))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Phase 2: Fix Database Functions Security
-- Update existing functions to have explicit search_path
CREATE OR REPLACE FUNCTION public.audit_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, new_data, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(NEW), now());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, old_data, new_data, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW), now());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, old_data, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(OLD), now());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Update other functions to have explicit search_path
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE(id uuid, display_name text, business_name text, location text, specialties text[], years_experience integer, website_url text, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.business_name,
    p.location,
    p.specialties,
    p.years_experience,
    p.website_url,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = profile_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_saved_services_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, circle_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    100  -- Welcome bonus points
  );
  RETURN NEW;
END;
$function$;

-- Enhanced admin audit function
CREATE OR REPLACE FUNCTION public.audit_admin_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Log when admin status changes
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, old_data, new_data, timestamp)
    VALUES (
      'profiles_admin_change',
      'UPDATE',
      auth.uid(),
      jsonb_build_object('user_id', OLD.user_id, 'is_admin', OLD.is_admin, 'changed_by', auth.uid()),
      jsonb_build_object('user_id', NEW.user_id, 'is_admin', NEW.is_admin, 'changed_by', auth.uid()),
      now()
    );
  END IF;
  
  -- Log when creator verification changes
  IF OLD.creator_verified IS DISTINCT FROM NEW.creator_verified THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, old_data, new_data, timestamp)
    VALUES (
      'profiles_creator_verification_change',
      'UPDATE',
      auth.uid(),
      jsonb_build_object('user_id', OLD.user_id, 'creator_verified', OLD.creator_verified, 'changed_by', auth.uid()),
      jsonb_build_object('user_id', NEW.user_id, 'creator_verified', NEW.creator_verified, 'changed_by', auth.uid()),
      now()
    );
  END IF;
  
  -- Log when specialties change to include admin
  IF (OLD.specialties IS DISTINCT FROM NEW.specialties) AND 
     ('admin' = ANY(NEW.specialties) OR NEW.specialties @> ARRAY['admin'::text]) THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, old_data, new_data, timestamp)
    VALUES (
      'profiles_admin_specialty_change',
      'UPDATE',
      auth.uid(),
      jsonb_build_object('user_id', OLD.user_id, 'specialties', OLD.specialties, 'changed_by', auth.uid()),
      jsonb_build_object('user_id', NEW.user_id, 'specialties', NEW.specialties, 'changed_by', auth.uid()),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update RLS policies to use the new secure functions
-- Update audit_log policies to use new admin function
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_log;
CREATE POLICY "Only admins can view audit logs" ON public.audit_log
FOR SELECT
USING (public.get_user_admin_status());

DROP POLICY IF EXISTS "Only admins can delete audit logs" ON public.audit_log;
CREATE POLICY "Only admins can delete audit logs" ON public.audit_log
FOR DELETE
USING (public.get_user_admin_status());

DROP POLICY IF EXISTS "Only admins can update audit logs" ON public.audit_log;
CREATE POLICY "Only admins can update audit logs" ON public.audit_log
FOR UPDATE
USING (public.get_user_admin_status());

-- Update content policies
DROP POLICY IF EXISTS "Admins can manage all content" ON public.content;
CREATE POLICY "Admins can manage all content" ON public.content
FOR ALL
USING (public.get_user_admin_status());

-- Update revenue_tracking policies
DROP POLICY IF EXISTS "Admins can manage all revenue" ON public.revenue_tracking;
CREATE POLICY "Admins can manage all revenue" ON public.revenue_tracking
FOR ALL
USING (public.get_user_admin_status());

-- Update services policies
DROP POLICY IF EXISTS "Only admins can insert services" ON public.services;
CREATE POLICY "Only admins can insert services" ON public.services
FOR INSERT
WITH CHECK (public.get_user_admin_status());

DROP POLICY IF EXISTS "Only admins can update services" ON public.services;
CREATE POLICY "Only admins can update services" ON public.services
FOR UPDATE
USING (public.get_user_admin_status());

-- Update vendors policies
DROP POLICY IF EXISTS "Only admins can insert vendors" ON public.vendors;
CREATE POLICY "Only admins can insert vendors" ON public.vendors
FOR INSERT
WITH CHECK (public.get_user_admin_status());

DROP POLICY IF EXISTS "Only admins can update vendors" ON public.vendors;
CREATE POLICY "Only admins can update vendors" ON public.vendors
FOR UPDATE
USING (public.get_user_admin_status());

-- Update videos policies
DROP POLICY IF EXISTS "Admins can manage all videos" ON public.videos;
CREATE POLICY "Admins can manage all videos" ON public.videos
FOR ALL
USING (public.get_user_admin_status());

-- Add missing DELETE policies for better security
CREATE POLICY "Users can delete their own content ratings" ON public.content_ratings
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video ratings" ON public.video_ratings
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete services" ON public.services
FOR DELETE
USING (public.get_user_admin_status());

CREATE POLICY "Admins can delete vendors" ON public.vendors
FOR DELETE
USING (public.get_user_admin_status());

-- Add security table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  event_data jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events" ON public.security_events
FOR SELECT
USING (public.get_user_admin_status());

-- System can insert security events
CREATE POLICY "System can insert security events" ON public.security_events
FOR INSERT
WITH CHECK (true);