-- Create user_sessions table for session management and account sharing prevention
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  location_data JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  
  -- Add indexes for performance
  UNIQUE(user_id, session_id)
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (get_user_admin_status());

-- Create indexes for performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_sessions_activity ON public.user_sessions(last_activity DESC) WHERE is_active = true;

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_user_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions 
  SET is_active = false
  WHERE expires_at < now() OR last_activity < (now() - interval '24 hours');
END;
$$;

-- Create view for admin monitoring of potential account sharing
CREATE OR REPLACE VIEW public.session_sharing_alerts AS
SELECT 
  u.id as user_id,
  u.email,
  COUNT(DISTINCT s.ip_address) as unique_ips,
  COUNT(DISTINCT s.device_fingerprint) as unique_devices,
  COUNT(*) as active_sessions,
  array_agg(DISTINCT s.ip_address::text) as ip_addresses,
  max(s.last_activity) as latest_activity
FROM auth.users u
JOIN public.user_sessions s ON u.id = s.user_id
WHERE s.is_active = true 
  AND s.last_activity > (now() - interval '24 hours')
GROUP BY u.id, u.email
HAVING COUNT(DISTINCT s.ip_address) > 2 OR COUNT(*) > 3
ORDER BY unique_ips DESC, active_sessions DESC;

-- Add session enforcement config
INSERT INTO public.app_config (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- Add session management settings to app config if they don't exist
DO $$
BEGIN
  -- Check if columns exist before adding them
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_config' AND column_name = 'max_concurrent_sessions') THEN
    ALTER TABLE public.app_config ADD COLUMN max_concurrent_sessions INTEGER DEFAULT 3;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_config' AND column_name = 'session_enforcement_mode') THEN
    ALTER TABLE public.app_config ADD COLUMN session_enforcement_mode TEXT DEFAULT 'warn';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_config' AND column_name = 'track_ip_changes') THEN
    ALTER TABLE public.app_config ADD COLUMN track_ip_changes BOOLEAN DEFAULT true;
  END IF;
END $$;