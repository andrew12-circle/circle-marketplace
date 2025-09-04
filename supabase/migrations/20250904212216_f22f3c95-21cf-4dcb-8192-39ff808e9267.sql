-- Create QuickBooks Online connections table
CREATE TABLE public.qbo_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  realm_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  scope TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create composite index for efficient lookups
CREATE INDEX idx_qbo_connections_org_realm ON public.qbo_connections(org_id, realm_id);

-- Enable RLS
ALTER TABLE public.qbo_connections ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy
CREATE POLICY "qbo_admin_only" ON public.qbo_connections
  FOR ALL 
  TO authenticated
  USING (get_user_admin_status() = true)
  WITH CHECK (get_user_admin_status() = true);

-- Create function to update tokens atomically
CREATE OR REPLACE FUNCTION public.update_qbo_tokens(
  p_org_id UUID,
  p_realm_id TEXT,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.qbo_connections (
    org_id, 
    realm_id, 
    access_token, 
    refresh_token, 
    expires_at,
    updated_at
  )
  VALUES (
    p_org_id, 
    p_realm_id, 
    p_access_token, 
    p_refresh_token, 
    p_expires_at,
    now()
  )
  ON CONFLICT (org_id, realm_id) 
  DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();
END;
$$;