-- Add signature tracking fields to co_pay_requests
ALTER TABLE public.co_pay_requests 
ADD COLUMN agent_signature_date timestamp with time zone,
ADD COLUMN vendor_signature_date timestamp with time zone,
ADD COLUMN comarketing_agreement_url text,
ADD COLUMN agreement_template_version text;

-- Update compliance_status enum to include signature statuses
ALTER TYPE compliance_status_enum ADD VALUE IF NOT EXISTS 'pending_signatures';
ALTER TYPE compliance_status_enum ADD VALUE IF NOT EXISTS 'signatures_complete';

-- Create comarketing_agreement_templates table
CREATE TABLE public.comarketing_agreement_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name text NOT NULL,
  template_content text NOT NULL,
  version text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create agreement_signatures table for detailed tracking
CREATE TABLE public.agreement_signatures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  co_pay_request_id uuid NOT NULL,
  signer_id uuid NOT NULL,
  signer_type text NOT NULL CHECK (signer_type IN ('agent', 'vendor')),
  signature_data text,
  ip_address inet,
  user_agent text,
  signed_at timestamp with time zone NOT NULL DEFAULT now(),
  agreement_template_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.comarketing_agreement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_signatures ENABLE ROW LEVEL SECURITY;

-- RLS policies for comarketing_agreement_templates
CREATE POLICY "Admins can manage agreement templates" 
ON public.comarketing_agreement_templates 
FOR ALL 
USING (get_user_admin_status());

CREATE POLICY "Templates are viewable by authenticated users" 
ON public.comarketing_agreement_templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS policies for agreement_signatures
CREATE POLICY "Users can view their own signatures" 
ON public.agreement_signatures 
FOR SELECT 
USING (auth.uid() = signer_id);

CREATE POLICY "Users can create their own signatures" 
ON public.agreement_signatures 
FOR INSERT 
WITH CHECK (auth.uid() = signer_id);

CREATE POLICY "Admins can view all signatures" 
ON public.agreement_signatures 
FOR SELECT 
USING (get_user_admin_status());

-- Add foreign key constraints
ALTER TABLE public.agreement_signatures 
ADD CONSTRAINT fk_agreement_signatures_co_pay_request 
FOREIGN KEY (co_pay_request_id) REFERENCES public.co_pay_requests(id) ON DELETE CASCADE;

ALTER TABLE public.agreement_signatures 
ADD CONSTRAINT fk_agreement_signatures_template 
FOREIGN KEY (agreement_template_id) REFERENCES public.comarketing_agreement_templates(id);

-- Create function to update agreement updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_agreement_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for agreement templates
CREATE TRIGGER update_agreement_templates_updated_at
BEFORE UPDATE ON public.comarketing_agreement_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_agreement_template_updated_at();

-- Update the co-pay status change handler to include signature workflow
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
  
  -- Check if both signatures are complete
  IF NEW.agent_signature_date IS NOT NULL AND NEW.vendor_signature_date IS NOT NULL 
     AND NEW.compliance_status = 'pending_signatures' THEN
    UPDATE public.co_pay_requests 
    SET compliance_status = 'signatures_complete'
    WHERE id = NEW.id;
    
    -- Send completion notification
    PERFORM net.http_post(
      url := 'https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/send-copay-notification-resilient',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'co_pay_request_id', NEW.id,
        'notification_type', 'signatures_complete'
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for signature workflow
CREATE TRIGGER handle_copay_signature_workflow_trigger
AFTER UPDATE ON public.co_pay_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_copay_signature_workflow();

-- Insert default agreement template
INSERT INTO public.comarketing_agreement_templates (
  template_name,
  template_content,
  version,
  created_by
) VALUES (
  'Standard Co-Marketing Agreement',
  'CO-MARKETING AGREEMENT

This Co-Marketing Agreement ("Agreement") is entered into between:

AGENT: {{agent_name}} ({{agent_email}})
VENDOR: {{vendor_name}} ({{vendor_email}})

SERVICE: {{service_title}}
SPLIT PERCENTAGE: {{split_percentage}}%
REQUEST DATE: {{request_date}}

TERMS AND CONDITIONS:

1. RESPA COMPLIANCE
Both parties acknowledge this arrangement complies with the Real Estate Settlement Procedures Act (RESPA) Section 8 and related regulations.

2. FAIR MARKET VALUE
The co-marketing split represents fair market value for legitimate marketing services to be provided.

3. MARKETING OBLIGATIONS
Agent agrees to provide legitimate marketing services including but not limited to:
- Client referrals within their professional network
- Co-branded marketing materials
- Joint promotional activities
- Professional endorsements

4. PAYMENT TERMS
Vendor agrees to provide the agreed split percentage for qualifying transactions resulting from this co-marketing arrangement.

5. COMPLIANCE DOCUMENTATION
Both parties will maintain all required documentation to demonstrate RESPA compliance including this executed agreement.

6. TERMINATION
Either party may terminate this agreement with 30 days written notice.

By signing below, both parties acknowledge they have read, understood, and agree to be bound by these terms.

Agent Signature: _________________ Date: _________
Vendor Signature: _________________ Date: _________',
  '1.0'
);