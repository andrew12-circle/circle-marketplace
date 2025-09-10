-- Create table for tracking service compliance and outreach
CREATE TABLE public.service_compliance_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Approval status
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  approval_date TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  
  -- 30-day tracking
  initial_listing_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deadline_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  
  -- Outreach tracking
  minimum_outreach_count INTEGER NOT NULL DEFAULT 3,
  current_outreach_count INTEGER NOT NULL DEFAULT 0,
  
  -- Created by
  created_by UUID NOT NULL DEFAULT auth.uid(),
  updated_by UUID NOT NULL DEFAULT auth.uid()
);

-- Create table for individual outreach attempts
CREATE TABLE public.service_outreach_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  compliance_tracking_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Outreach details
  contact_method TEXT NOT NULL CHECK (contact_method IN ('email', 'phone', 'mail', 'website_form', 'other')),
  contact_target TEXT NOT NULL, -- email address, phone number, etc.
  attempt_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Content and evidence
  subject_line TEXT,
  message_content TEXT,
  evidence_url TEXT, -- link to email screenshot, document, etc.
  evidence_type TEXT CHECK (evidence_type IN ('screenshot', 'email_receipt', 'document', 'other')),
  
  -- Response tracking
  response_received BOOLEAN NOT NULL DEFAULT false,
  response_date TIMESTAMP WITH TIME ZONE,
  response_content TEXT,
  
  -- Created by
  created_by UUID NOT NULL DEFAULT auth.uid(),
  
  CONSTRAINT fk_outreach_compliance 
    FOREIGN KEY (compliance_tracking_id) 
    REFERENCES public.service_compliance_tracking(id) 
    ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.service_compliance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_outreach_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for compliance tracking
CREATE POLICY "Admins can manage all compliance tracking" 
ON public.service_compliance_tracking 
FOR ALL 
TO authenticated 
USING (get_user_admin_status() = true)
WITH CHECK (get_user_admin_status() = true);

-- Policies for outreach attempts
CREATE POLICY "Admins can manage all outreach attempts" 
ON public.service_outreach_attempts 
FOR ALL 
TO authenticated 
USING (get_user_admin_status() = true)
WITH CHECK (get_user_admin_status() = true);

-- Create indexes for performance
CREATE INDEX idx_service_compliance_service_id ON public.service_compliance_tracking(service_id);
CREATE INDEX idx_service_compliance_status ON public.service_compliance_tracking(approval_status);
CREATE INDEX idx_service_compliance_deadline ON public.service_compliance_tracking(deadline_date);

CREATE INDEX idx_outreach_attempts_service_id ON public.service_outreach_attempts(service_id);
CREATE INDEX idx_outreach_attempts_compliance_id ON public.service_outreach_attempts(compliance_tracking_id);
CREATE INDEX idx_outreach_attempts_method ON public.service_outreach_attempts(contact_method);

-- Create trigger to update outreach count
CREATE OR REPLACE FUNCTION public.update_outreach_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the current outreach count
  UPDATE public.service_compliance_tracking 
  SET 
    current_outreach_count = (
      SELECT COUNT(*) 
      FROM public.service_outreach_attempts 
      WHERE compliance_tracking_id = NEW.compliance_tracking_id
    ),
    updated_at = now(),
    updated_by = auth.uid()
  WHERE id = NEW.compliance_tracking_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_outreach_count
  AFTER INSERT ON public.service_outreach_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_outreach_count();

-- Create trigger to auto-approve after 30 days with minimum outreach
CREATE OR REPLACE FUNCTION public.check_auto_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if we should auto-approve
  IF NEW.current_outreach_count >= NEW.minimum_outreach_count 
     AND now() >= NEW.deadline_date 
     AND NEW.approval_status = 'pending' THEN
    
    NEW.approval_status := 'auto_approved';
    NEW.approval_date := now();
    NEW.approval_notes := COALESCE(NEW.approval_notes, '') || 
      ' Auto-approved after 30 days with ' || NEW.current_outreach_count || ' outreach attempts.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_auto_approval
  BEFORE UPDATE ON public.service_compliance_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.check_auto_approval();