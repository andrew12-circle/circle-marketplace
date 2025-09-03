-- Create service drafts table for vendor self-editing
CREATE TABLE public.service_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL,
  draft_data JSONB NOT NULL DEFAULT '{}',
  funnel_data JSONB NOT NULL DEFAULT '{}',
  change_type TEXT NOT NULL DEFAULT 'update', -- 'update', 'create'
  change_summary TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  rejection_reason TEXT
);

-- Create vendor profile drafts table
CREATE TABLE public.vendor_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL DEFAULT '{}',
  change_type TEXT NOT NULL DEFAULT 'update',
  change_summary TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  rejection_reason TEXT
);

-- Create admin notifications table
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'service_draft_pending', 'vendor_draft_pending'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_id UUID NOT NULL, -- service_draft_id or vendor_draft_id
  entity_type TEXT NOT NULL, -- 'service_draft', 'vendor_draft'
  vendor_id UUID NOT NULL,
  vendor_name TEXT,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID
);

-- Enable RLS on all tables
ALTER TABLE public.service_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_drafts
CREATE POLICY "Vendors can manage their service drafts" ON public.service_drafts
  FOR ALL USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all service drafts" ON public.service_drafts
  FOR ALL USING (get_user_admin_status());

-- RLS policies for vendor_drafts
CREATE POLICY "Vendors can manage their vendor drafts" ON public.vendor_drafts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.vendors v WHERE v.id = vendor_drafts.vendor_id AND v.id = auth.uid()
  ));

CREATE POLICY "Admins can manage all vendor drafts" ON public.vendor_drafts
  FOR ALL USING (get_user_admin_status());

-- RLS policies for admin_notifications
CREATE POLICY "Admins can manage all notifications" ON public.admin_notifications
  FOR ALL USING (get_user_admin_status());

-- Create indexes for performance
CREATE INDEX idx_service_drafts_vendor_id ON public.service_drafts(vendor_id);
CREATE INDEX idx_service_drafts_service_id ON public.service_drafts(service_id);
CREATE INDEX idx_service_drafts_status ON public.service_drafts(status);
CREATE INDEX idx_vendor_drafts_vendor_id ON public.vendor_drafts(vendor_id);
CREATE INDEX idx_vendor_drafts_status ON public.vendor_drafts(status);
CREATE INDEX idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at);

-- Create function to notify admins when drafts are created
CREATE OR REPLACE FUNCTION public.notify_admin_of_draft_creation()
RETURNS TRIGGER AS $$
DECLARE
  vendor_name_val TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get vendor name
  SELECT name INTO vendor_name_val FROM public.vendors WHERE id = NEW.vendor_id;
  
  -- Create notification based on table
  IF TG_TABLE_NAME = 'service_drafts' THEN
    notification_title := 'Service Update Pending Review';
    notification_message := 'Vendor "' || COALESCE(vendor_name_val, 'Unknown') || '" has submitted changes to a service for review.';
    
    INSERT INTO public.admin_notifications (
      type, title, message, entity_id, entity_type, vendor_id, vendor_name, priority
    ) VALUES (
      'service_draft_pending', notification_title, notification_message, 
      NEW.id, 'service_draft', NEW.vendor_id, vendor_name_val, 'medium'
    );
  ELSIF TG_TABLE_NAME = 'vendor_drafts' THEN
    notification_title := 'Vendor Profile Update Pending Review';
    notification_message := 'Vendor "' || COALESCE(vendor_name_val, 'Unknown') || '" has submitted profile changes for review.';
    
    INSERT INTO public.admin_notifications (
      type, title, message, entity_id, entity_type, vendor_id, vendor_name, priority
    ) VALUES (
      'vendor_draft_pending', notification_title, notification_message, 
      NEW.id, 'vendor_draft', NEW.vendor_id, vendor_name_val, 'medium'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for notifications
CREATE TRIGGER service_draft_notification_trigger
  AFTER INSERT ON public.service_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_of_draft_creation();

CREATE TRIGGER vendor_draft_notification_trigger
  AFTER INSERT ON public.vendor_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_of_draft_creation();

-- Create function for admins to approve/reject drafts
CREATE OR REPLACE FUNCTION public.admin_review_draft(
  draft_table TEXT,
  draft_id UUID,
  action TEXT, -- 'approve' or 'reject'
  rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  draft_record RECORD;
  result JSONB;
BEGIN
  -- Check admin status
  IF NOT get_user_admin_status() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admin access required';
  END IF;
  
  -- Get draft record
  IF draft_table = 'service_drafts' THEN
    SELECT * INTO draft_record FROM public.service_drafts WHERE id = draft_id;
  ELSIF draft_table = 'vendor_drafts' THEN
    SELECT * INTO draft_record FROM public.vendor_drafts WHERE id = draft_id;
  ELSE
    RAISE EXCEPTION 'INVALID_TABLE: Invalid draft table specified';
  END IF;
  
  IF draft_record.id IS NULL THEN
    RAISE EXCEPTION 'DRAFT_NOT_FOUND: Draft not found';
  END IF;
  
  -- Process based on action
  IF action = 'approve' THEN
    -- Apply changes to live data
    IF draft_table = 'service_drafts' THEN
      -- Update service with draft data
      UPDATE public.services 
      SET 
        title = COALESCE((draft_record.draft_data->>'title')::TEXT, title),
        description = COALESCE((draft_record.draft_data->>'description')::TEXT, description),
        retail_price = COALESCE((draft_record.draft_data->>'retail_price')::TEXT, retail_price),
        pro_price = COALESCE((draft_record.draft_data->>'pro_price')::TEXT, pro_price),
        category = COALESCE((draft_record.draft_data->>'category')::TEXT, category),
        image_url = COALESCE((draft_record.draft_data->>'image_url')::TEXT, image_url),
        funnel_content = COALESCE(draft_record.funnel_data, funnel_content),
        updated_at = now()
      WHERE id = draft_record.service_id;
    ELSIF draft_table = 'vendor_drafts' THEN
      -- Update vendor with draft data
      UPDATE public.vendors 
      SET 
        name = COALESCE((draft_record.draft_data->>'name')::TEXT, name),
        description = COALESCE((draft_record.draft_data->>'description')::TEXT, description),
        contact_email = COALESCE((draft_record.draft_data->>'contact_email')::TEXT, contact_email),
        contact_phone = COALESCE((draft_record.draft_data->>'contact_phone')::TEXT, contact_phone),
        website_url = COALESCE((draft_record.draft_data->>'website_url')::TEXT, website_url),
        logo_url = COALESCE((draft_record.draft_data->>'logo_url')::TEXT, logo_url),
        updated_at = now()
      WHERE id = draft_record.vendor_id;
    END IF;
    
    -- Update draft status
    EXECUTE format('UPDATE public.%I SET status = $1, reviewed_at = $2, reviewed_by = $3 WHERE id = $4', 
                  draft_table) 
    USING 'approved', now(), auth.uid(), draft_id;
    
  ELSIF action = 'reject' THEN
    -- Update draft status with rejection reason
    EXECUTE format('UPDATE public.%I SET status = $1, reviewed_at = $2, reviewed_by = $3, rejection_reason = $4 WHERE id = $5', 
                  draft_table) 
    USING 'rejected', now(), auth.uid(), rejection_reason, draft_id;
  ELSE
    RAISE EXCEPTION 'INVALID_ACTION: Action must be approve or reject';
  END IF;
  
  -- Mark notification as read
  UPDATE public.admin_notifications 
  SET read = true, read_at = now(), read_by = auth.uid()
  WHERE entity_id = draft_id AND entity_type = draft_table;
  
  result := jsonb_build_object(
    'success', true,
    'action', action,
    'draft_id', draft_id,
    'reviewed_by', auth.uid(),
    'reviewed_at', now()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;