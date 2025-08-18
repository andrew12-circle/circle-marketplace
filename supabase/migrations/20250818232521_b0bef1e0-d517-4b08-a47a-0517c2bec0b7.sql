-- CRITICAL SECURITY FIXES FOR LAUNCH READINESS (Fixed Syntax)

-- 1. Fix Function Search Path Issues (Security Warning)
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

-- 2. Create security monitoring table for launch
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

-- Drop existing policies first
DROP POLICY IF EXISTS "security_monitoring_admin_only" ON public.security_monitoring;
DROP POLICY IF EXISTS "security_monitoring_system_insert" ON public.security_monitoring;

-- Only admins can view security monitoring
CREATE POLICY "security_monitoring_admin_only" ON public.security_monitoring
    FOR ALL USING (public.get_user_admin_status());

-- System can insert security events  
CREATE POLICY "security_monitoring_system_insert" ON public.security_monitoring
    FOR INSERT WITH CHECK (true);

-- 3. Add missing orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    stripe_session_id text UNIQUE,
    amount integer,
    currency text DEFAULT 'usd',
    status text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop and recreate orders policies
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;

CREATE POLICY "orders_select_own" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own" ON public.orders  
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Add missing profiles policies if they don't exist
-- Check if profiles table exists and add policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Drop existing policies first
        DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
        DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
        DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
        
        -- Create new policies
        CREATE POLICY "profiles_select_own" ON public.profiles
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "profiles_update_own" ON public.profiles  
            FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "profiles_insert_own" ON public.profiles
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;