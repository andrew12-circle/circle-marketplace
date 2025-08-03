-- First check what compliance_status values are currently used
SELECT DISTINCT compliance_status FROM public.co_pay_requests;

-- Add signature tracking fields to co_pay_requests
ALTER TABLE public.co_pay_requests 
ADD COLUMN IF NOT EXISTS agent_signature_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS vendor_signature_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS comarketing_agreement_url text,
ADD COLUMN IF NOT EXISTS agreement_template_version text;

-- Create comarketing_agreement_templates table
CREATE TABLE IF NOT EXISTS public.comarketing_agreement_templates (
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
CREATE TABLE IF NOT EXISTS public.agreement_signatures (
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
DROP POLICY IF EXISTS "Admins can manage agreement templates" ON public.comarketing_agreement_templates;
CREATE POLICY "Admins can manage agreement templates" 
ON public.comarketing_agreement_templates 
FOR ALL 
USING (get_user_admin_status());

DROP POLICY IF EXISTS "Templates are viewable by authenticated users" ON public.comarketing_agreement_templates;
CREATE POLICY "Templates are viewable by authenticated users" 
ON public.comarketing_agreement_templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS policies for agreement_signatures
DROP POLICY IF EXISTS "Users can view their own signatures" ON public.agreement_signatures;
CREATE POLICY "Users can view their own signatures" 
ON public.agreement_signatures 
FOR SELECT 
USING (auth.uid() = signer_id);

DROP POLICY IF EXISTS "Users can create their own signatures" ON public.agreement_signatures;
CREATE POLICY "Users can create their own signatures" 
ON public.agreement_signatures 
FOR INSERT 
WITH CHECK (auth.uid() = signer_id);

DROP POLICY IF EXISTS "Admins can view all signatures" ON public.agreement_signatures;
CREATE POLICY "Admins can view all signatures" 
ON public.agreement_signatures 
FOR SELECT 
USING (get_user_admin_status());

-- Add foreign key constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_agreement_signatures_co_pay_request'
  ) THEN
    ALTER TABLE public.agreement_signatures 
    ADD CONSTRAINT fk_agreement_signatures_co_pay_request 
    FOREIGN KEY (co_pay_request_id) REFERENCES public.co_pay_requests(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_agreement_signatures_template'
  ) THEN
    ALTER TABLE public.agreement_signatures 
    ADD CONSTRAINT fk_agreement_signatures_template 
    FOREIGN KEY (agreement_template_id) REFERENCES public.comarketing_agreement_templates(id);
  END IF;
END $$;

-- Create function to update agreement updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_agreement_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for agreement templates
DROP TRIGGER IF EXISTS update_agreement_templates_updated_at ON public.comarketing_agreement_templates;
CREATE TRIGGER update_agreement_templates_updated_at
BEFORE UPDATE ON public.comarketing_agreement_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_agreement_template_updated_at();

-- Insert default agreement template if it doesn't exist
INSERT INTO public.comarketing_agreement_templates (
  template_name,
  template_content,
  version,
  created_by
) 
SELECT 
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
  '1.0',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.comarketing_agreement_templates 
  WHERE template_name = 'Standard Co-Marketing Agreement'
);