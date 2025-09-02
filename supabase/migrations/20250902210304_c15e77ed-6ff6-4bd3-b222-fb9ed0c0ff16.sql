-- Create immutable audit log table
CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_audit_log_actor ON public.audit_log(actor);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);
CREATE INDEX idx_audit_log_target ON public.audit_log(target);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can insert audit logs" ON public.audit_log
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert their own audit logs" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor);

CREATE POLICY "Admins can read all audit logs" ON public.audit_log
  FOR SELECT TO authenticated
  USING (get_user_admin_status());

-- Create trigger to prevent updates and deletes
CREATE OR REPLACE FUNCTION prevent_audit_log_modifications()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log entries are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_log_updates
  BEFORE UPDATE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modifications();

CREATE TRIGGER prevent_audit_log_deletes
  BEFORE DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modifications();

-- Create user sessions table for session management
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  invalidated_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address INET
);

-- Create indexes
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user sessions
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (get_user_admin_status());

-- Create TOTP table
CREATE TABLE public.user_totp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  secret TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  backup_codes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_totp ENABLE ROW LEVEL SECURITY;

-- RLS Policies for TOTP
CREATE POLICY "Users can manage their own TOTP" ON public.user_totp
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create file scan queue table
CREATE TABLE public.file_scan_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_key TEXT NOT NULL,
  bucket TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'safe', 'quarantined', 'error')),
  scan_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_file_scan_queue_status ON public.file_scan_queue(status);
CREATE INDEX idx_file_scan_queue_created_at ON public.file_scan_queue(created_at);

-- Enable RLS
ALTER TABLE public.file_scan_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for file scan queue
CREATE POLICY "Users can view their own file scans" ON public.file_scan_queue
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage file scans" ON public.file_scan_queue
  FOR ALL TO service_role
  WITH CHECK (true);

-- Add last_step_up_at to profiles for step-up auth
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_step_up_at TIMESTAMPTZ;