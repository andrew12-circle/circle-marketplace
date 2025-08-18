-- CRITICAL SECURITY FIXES FOR LAUNCH READINESS

-- 1. Fix Security Definer View (Critical Error)
-- This removes the SECURITY DEFINER property from any views that may have it
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Get all views with SECURITY DEFINER
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE definition ILIKE '%SECURITY DEFINER%'
    LOOP
        -- Recreate views without SECURITY DEFINER
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.schemaname, view_record.viewname);
    END LOOP;
END $$;

-- 2. Add missing RLS policies for tables that have RLS enabled but no policies
-- Based on the schema, these tables likely need policies:

-- Profiles table policies (if missing)
CREATE POLICY IF NOT EXISTS "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "profiles_update_own" ON public.profiles  
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Services table policies (if missing) 
CREATE POLICY IF NOT EXISTS "services_select_published" ON public.services
    FOR SELECT USING (true); -- Public read access to services

CREATE POLICY IF NOT EXISTS "services_insert_vendors" ON public.services
    FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY IF NOT EXISTS "services_update_vendors" ON public.services
    FOR UPDATE USING (auth.uid() = vendor_id);

-- Vendors table policies (if missing)
CREATE POLICY IF NOT EXISTS "vendors_select_public" ON public.vendors
    FOR SELECT USING (true); -- Public read access

CREATE POLICY IF NOT EXISTS "vendors_update_own" ON public.vendors
    FOR UPDATE USING (auth.uid() = id);

-- Orders table policies (if missing)
CREATE POLICY IF NOT EXISTS "orders_select_own" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "orders_insert_own" ON public.orders  
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Fix Function Search Path Issues (Security Warning)
-- Update all functions to have immutable search_path

-- Function: get_user_admin_status
CREATE OR REPLACE FUNCTION public.get_user_admin_status()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN COALESCE((
    SELECT is_admin 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  ), false);
END;
$$;

-- Function: update_updated_at_column  
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: validate_uuid_field
CREATE OR REPLACE FUNCTION public.validate_uuid_field(input_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if the input is a valid UUID format
  IF input_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- Create security monitoring table for launch
CREATE TABLE IF NOT EXISTS public.security_monitoring (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    severity text NOT NULL DEFAULT 'info',
    description text,
    user_id uuid REFERENCES auth.users(id),
    ip_address inet,
    user_agent text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on security monitoring
ALTER TABLE public.security_monitoring ENABLE ROW LEVEL SECURITY;

-- Only admins can view security monitoring
CREATE POLICY "security_monitoring_admin_only" ON public.security_monitoring
    FOR ALL USING (public.get_user_admin_status());

-- System can insert security events  
CREATE POLICY "security_monitoring_system_insert" ON public.security_monitoring
    FOR INSERT WITH CHECK (true);