-- Add compliance workflow to co-pay requests
ALTER TABLE public.co_pay_requests 
ADD COLUMN compliance_status TEXT DEFAULT 'pending_vendor' CHECK (compliance_status IN ('pending_vendor', 'vendor_approved', 'pending_compliance', 'compliance_approved', 'compliance_rejected', 'final_approved', 'expired')),
ADD COLUMN compliance_reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN compliance_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN compliance_notes TEXT,
ADD COLUMN marketing_campaign_details JSONB DEFAULT '{}',
ADD COLUMN requires_documentation BOOLEAN DEFAULT true;

-- Update existing records to new workflow
UPDATE public.co_pay_requests 
SET compliance_status = CASE 
  WHEN status = 'approved' THEN 'vendor_approved'
  WHEN status = 'denied' THEN 'compliance_rejected'
  WHEN status = 'pending' THEN 'pending_vendor'
  WHEN status = 'expired' THEN 'expired'
  ELSE 'pending_vendor'
END;

-- Create compliance documents table
CREATE TABLE public.compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  co_pay_request_id UUID NOT NULL REFERENCES public.co_pay_requests(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('flyer', 'marketing_material', 'agreement', 'compliance_memo', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  compliance_approved BOOLEAN DEFAULT false,
  compliance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliance team roles table
CREATE TABLE public.compliance_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('reviewer', 'manager', 'admin')),
  specialties TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create compliance workflow log
CREATE TABLE public.compliance_workflow_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  co_pay_request_id UUID NOT NULL REFERENCES public.co_pay_requests(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on new tables
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_workflow_log ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for compliance documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('compliance-docs', 'compliance-docs', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- RLS Policies for compliance_documents
CREATE POLICY "Compliance team can view all documents" ON public.compliance_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.compliance_team_members WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Request participants can view their documents" ON public.compliance_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.co_pay_requests 
      WHERE id = compliance_documents.co_pay_request_id 
      AND (agent_id = auth.uid() OR vendor_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can upload documents" ON public.compliance_documents
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Compliance team can update documents" ON public.compliance_documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.compliance_team_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- RLS Policies for compliance_team_members
CREATE POLICY "Admins can manage compliance team" ON public.compliance_team_members
  FOR ALL USING (get_user_admin_status());

CREATE POLICY "Compliance members can view team" ON public.compliance_team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.compliance_team_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- RLS Policies for compliance_workflow_log
CREATE POLICY "Compliance team can view workflow logs" ON public.compliance_workflow_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.compliance_team_members WHERE user_id = auth.uid() AND is_active = true)
    OR get_user_admin_status()
  );

CREATE POLICY "System can insert workflow logs" ON public.compliance_workflow_log
  FOR INSERT WITH CHECK (true);

-- Storage policies for compliance documents
CREATE POLICY "Compliance team can manage files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'compliance-docs' AND
    EXISTS (SELECT 1 FROM public.compliance_team_members WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Request participants can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'compliance-docs' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Request participants can view their files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'compliance-docs' AND
    auth.uid() IS NOT NULL
  );

-- Function to update compliance workflow log
CREATE OR REPLACE FUNCTION public.log_compliance_workflow_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.compliance_workflow_log (
    co_pay_request_id,
    action_type,
    performed_by,
    previous_status,
    new_status,
    notes
  ) VALUES (
    NEW.id,
    CASE 
      WHEN OLD.compliance_status IS DISTINCT FROM NEW.compliance_status THEN 'status_change'
      WHEN OLD.compliance_notes IS DISTINCT FROM NEW.compliance_notes THEN 'notes_updated'
      ELSE 'updated'
    END,
    auth.uid(),
    OLD.compliance_status,
    NEW.compliance_status,
    CASE 
      WHEN OLD.compliance_notes IS DISTINCT FROM NEW.compliance_notes THEN NEW.compliance_notes
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for compliance workflow logging
CREATE TRIGGER compliance_workflow_change_trigger
  AFTER UPDATE ON public.co_pay_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_compliance_workflow_change();

-- Update co-pay status update trigger to handle new workflow
DROP TRIGGER IF EXISTS co_pay_status_change_trigger ON public.co_pay_requests;

CREATE OR REPLACE FUNCTION public.handle_copay_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only trigger notifications on major status changes
  IF OLD.compliance_status IS DISTINCT FROM NEW.compliance_status THEN
    -- Auto-advance vendor approved to pending compliance review
    IF NEW.compliance_status = 'vendor_approved' AND NEW.requires_documentation = false THEN
      UPDATE public.co_pay_requests 
      SET compliance_status = 'pending_compliance'
      WHERE id = NEW.id;
      RETURN NEW;
    END IF;
    
    -- Send notifications for key status changes
    IF NEW.compliance_status IN ('vendor_approved', 'compliance_approved', 'compliance_rejected', 'final_approved') THEN
      -- Call notification edge function
      PERFORM net.http_post(
        url := 'https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/send-copay-notification-resilient',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object(
          'co_pay_request_id', NEW.id,
          'notification_type', 
          CASE 
            WHEN NEW.compliance_status = 'vendor_approved' THEN 'vendor_approved'
            WHEN NEW.compliance_status = 'compliance_approved' THEN 'compliance_approved'
            WHEN NEW.compliance_status = 'compliance_rejected' THEN 'compliance_rejected'
            WHEN NEW.compliance_status = 'final_approved' THEN 'final_approved'
            ELSE 'status_change'
          END,
          'split_percentage', NEW.requested_split_percentage
        )::text
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER copay_compliance_status_change_trigger
  AFTER UPDATE ON public.co_pay_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_copay_status_change();