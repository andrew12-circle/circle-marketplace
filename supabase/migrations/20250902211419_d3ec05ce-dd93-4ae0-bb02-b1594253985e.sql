-- Create feature flags table for database-backed security controls
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read feature flags" ON public.feature_flags
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
  FOR ALL TO authenticated
  USING (get_user_admin_status())
  WITH CHECK (get_user_admin_status());