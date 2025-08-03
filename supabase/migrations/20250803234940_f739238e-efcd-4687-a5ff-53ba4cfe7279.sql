-- Update the existing trigger to handle the signature workflow properly
CREATE OR REPLACE FUNCTION public.handle_copay_signature_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Auto-advance compliance_approved to pending_signatures
  IF NEW.compliance_status = 'compliance_approved' AND OLD.compliance_status != 'compliance_approved' THEN
    -- Set status to pending_signatures
    UPDATE public.co_pay_requests 
    SET compliance_status = 'pending_signatures'
    WHERE id = NEW.id;
    
    -- Send signature request notifications
    PERFORM net.http_post(
      url := 'https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/send-signature-request',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'co_pay_request_id', NEW.id,
        'notification_type', 'signature_request'
      )::text
    );
    
    RETURN NEW;
  END IF;
  
  -- Check if both signatures are complete and auto-advance to final approval
  IF NEW.agent_signature_date IS NOT NULL AND NEW.vendor_signature_date IS NOT NULL 
     AND NEW.compliance_status = 'pending_signatures' THEN
    UPDATE public.co_pay_requests 
    SET compliance_status = 'final_approved'
    WHERE id = NEW.id;
    
    -- Send completion notification
    PERFORM net.http_post(
      url := 'https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/send-copay-notification-resilient',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'co_pay_request_id', NEW.id,
        'notification_type', 'final_approved'
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Make sure the trigger exists and is properly set up
DROP TRIGGER IF EXISTS handle_copay_signature_workflow_trigger ON public.co_pay_requests;
CREATE TRIGGER handle_copay_signature_workflow_trigger
AFTER UPDATE ON public.co_pay_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_copay_signature_workflow();