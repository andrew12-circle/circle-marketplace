-- Create agent invitations table for tracking outreach to top agents
CREATE TABLE public.agent_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_email TEXT NOT NULL,
  agent_name TEXT,
  agent_company TEXT,
  invitation_type TEXT NOT NULL DEFAULT 'playbook_creator',
  status TEXT NOT NULL DEFAULT 'sent',
  invited_by UUID REFERENCES auth.users(id),
  invitation_message TEXT,
  response_data JSONB DEFAULT '{}',
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.agent_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
CREATE POLICY "Admins can manage all invitations" 
ON public.agent_invitations 
FOR ALL 
USING (get_user_admin_status());

-- Create function to send invitation notifications
CREATE OR REPLACE FUNCTION public.send_agent_invitation_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call edge function to send invitation email
  PERFORM net.http_post(
    url := 'https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/send-notification',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object(
      'type', 'agent_invitation',
      'agent_email', NEW.agent_email,
      'agent_name', NEW.agent_name,
      'invitation_message', NEW.invitation_message,
      'invitation_id', NEW.id
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for sending invitations
CREATE TRIGGER send_agent_invitation_trigger
  AFTER INSERT ON public.agent_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.send_agent_invitation_notification();

-- Add invitation tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS invited_as_creator BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invitation_source TEXT;