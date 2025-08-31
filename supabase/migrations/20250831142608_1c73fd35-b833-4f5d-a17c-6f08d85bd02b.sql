-- Create table to track service updates for admin visibility
CREATE TABLE IF NOT EXISTS public.service_update_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL,
  section_name TEXT NOT NULL, -- 'details', 'disclaimer', 'funnel', 'research', 'faqs', 'verification'
  updated_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  update_type TEXT NOT NULL DEFAULT 'ai_generated', -- 'ai_generated', 'manual_edit'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_update_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can view service update tracking"
  ON public.service_update_tracking
  FOR SELECT
  USING (get_user_admin_status());

CREATE POLICY "Only admins can insert service update tracking"
  ON public.service_update_tracking
  FOR INSERT
  WITH CHECK (get_user_admin_status() AND auth.uid() = updated_by);

CREATE POLICY "Only admins can update service update tracking"
  ON public.service_update_tracking
  FOR UPDATE
  USING (get_user_admin_status());

-- Add index for performance
CREATE INDEX idx_service_update_tracking_service_id ON public.service_update_tracking(service_id);
CREATE INDEX idx_service_update_tracking_section ON public.service_update_tracking(service_id, section_name);
CREATE INDEX idx_service_update_tracking_updated_at ON public.service_update_tracking(updated_at DESC);