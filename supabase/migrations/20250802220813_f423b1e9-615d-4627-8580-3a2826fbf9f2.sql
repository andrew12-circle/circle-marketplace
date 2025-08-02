-- Fix function search path for security
CREATE OR REPLACE FUNCTION public.send_agent_invitation_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;