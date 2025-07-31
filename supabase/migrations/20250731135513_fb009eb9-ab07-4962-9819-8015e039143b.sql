-- Add co-pay related fields to services table
ALTER TABLE public.services 
ADD COLUMN co_pay_allowed boolean DEFAULT false,
ADD COLUMN max_vendor_split_percentage integer DEFAULT 0,
ADD COLUMN estimated_agent_split_percentage integer DEFAULT 0,
ADD COLUMN respa_category text,
ADD COLUMN respa_notes text;

-- Create co_pay_requests table for tracking requests
CREATE TABLE public.co_pay_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id uuid,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'expired')),
  requested_split_percentage integer NOT NULL,
  agent_notes text,
  vendor_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  ip_address inet,
  user_agent text
);

-- Create audit trail for co-pay actions
CREATE TABLE public.co_pay_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  co_pay_request_id uuid REFERENCES public.co_pay_requests(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- 'requested', 'approved', 'declined', 'expired', 'vendor_invited'
  performed_by uuid REFERENCES auth.users(id),
  action_details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create vendor invitations table
CREATE TABLE public.vendor_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_name text NOT NULL,
  vendor_email text NOT NULL,
  vendor_company text,
  invitation_token text UNIQUE DEFAULT gen_random_uuid()::text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

-- Enable RLS
ALTER TABLE public.co_pay_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.co_pay_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for co_pay_requests
CREATE POLICY "Users can view their own co-pay requests" 
ON public.co_pay_requests FOR SELECT 
USING (auth.uid() = agent_id OR auth.uid() = vendor_id);

CREATE POLICY "Users can create their own co-pay requests" 
ON public.co_pay_requests FOR INSERT 
WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Vendors can update co-pay requests" 
ON public.co_pay_requests FOR UPDATE 
USING (auth.uid() = vendor_id OR auth.uid() = agent_id);

CREATE POLICY "Admins can manage all co-pay requests" 
ON public.co_pay_requests FOR ALL 
USING (get_user_admin_status());

-- RLS Policies for audit log
CREATE POLICY "Admins can view audit logs" 
ON public.co_pay_audit_log FOR SELECT 
USING (get_user_admin_status());

CREATE POLICY "System can insert audit logs" 
ON public.co_pay_audit_log FOR INSERT 
WITH CHECK (true);

-- RLS Policies for vendor invitations
CREATE POLICY "Users can view their own invitations" 
ON public.vendor_invitations FOR SELECT 
USING (auth.uid() = invited_by);

CREATE POLICY "Users can create invitations" 
ON public.vendor_invitations FOR INSERT 
WITH CHECK (auth.uid() = invited_by);

-- Function to auto-expire co-pay requests
CREATE OR REPLACE FUNCTION expire_co_pay_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.co_pay_requests 
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' AND expires_at < now();
  
  -- Log the expiration
  INSERT INTO public.co_pay_audit_log (co_pay_request_id, action_type, action_details)
  SELECT id, 'expired', jsonb_build_object('auto_expired', true)
  FROM public.co_pay_requests 
  WHERE status = 'expired' AND updated_at = now();
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_co_pay_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_co_pay_requests_updated_at
  BEFORE UPDATE ON public.co_pay_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_co_pay_updated_at();