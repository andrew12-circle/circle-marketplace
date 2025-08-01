-- Create vendor activity tracking table
CREATE TABLE IF NOT EXISTS public.vendor_agent_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('consultation_booking', 'service_save', 'service_purchase', 'funnel_view', 'contact_request', 'co_pay_request')),
  activity_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_agent_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Agents can create their own activities" 
ON public.vendor_agent_activities 
FOR INSERT 
WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can view their own activities" 
ON public.vendor_agent_activities 
FOR SELECT 
USING (auth.uid() = agent_id);

CREATE POLICY "Vendors can view activities for their vendor" 
ON public.vendor_agent_activities 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_user_associations 
    WHERE vendor_id = vendor_agent_activities.vendor_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all activities" 
ON public.vendor_agent_activities 
FOR ALL 
USING (public.get_user_admin_status());

-- Create indexes for performance
CREATE INDEX idx_vendor_agent_activities_vendor_id ON public.vendor_agent_activities(vendor_id);
CREATE INDEX idx_vendor_agent_activities_agent_id ON public.vendor_agent_activities(agent_id);
CREATE INDEX idx_vendor_agent_activities_type ON public.vendor_agent_activities(activity_type);
CREATE INDEX idx_vendor_agent_activities_created_at ON public.vendor_agent_activities(created_at);

-- Create function to calculate active agent count for vendors
CREATE OR REPLACE FUNCTION public.calculate_vendor_active_agents(vendor_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  active_agent_count INTEGER;
BEGIN
  -- Count distinct agents who have had activity with this vendor in the last 90 days
  SELECT COUNT(DISTINCT agent_id) INTO active_agent_count
  FROM public.vendor_agent_activities
  WHERE vendor_id = vendor_uuid
  AND created_at > now() - interval '90 days';
  
  RETURN COALESCE(active_agent_count, 0);
END;
$$;

-- Create function to update vendor agent counts
CREATE OR REPLACE FUNCTION public.update_vendor_agent_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update the vendor's co_marketing_agents count
  UPDATE public.vendors 
  SET co_marketing_agents = public.calculate_vendor_active_agents(COALESCE(NEW.vendor_id, OLD.vendor_id))
  WHERE id = COALESCE(NEW.vendor_id, OLD.vendor_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to automatically update agent counts
CREATE TRIGGER trigger_update_vendor_agent_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_agent_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_agent_counts();

-- Create function to track vendor interactions
CREATE OR REPLACE FUNCTION public.track_vendor_activity(
  p_vendor_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  activity_id UUID;
BEGIN
  -- Insert the activity record
  INSERT INTO public.vendor_agent_activities (vendor_id, agent_id, activity_type, activity_data)
  VALUES (p_vendor_id, auth.uid(), p_activity_type, p_activity_data)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- Update existing vendor records to have calculated agent counts
UPDATE public.vendors 
SET co_marketing_agents = public.calculate_vendor_active_agents(id);

-- Add updated_at trigger for vendor_agent_activities
CREATE TRIGGER update_vendor_agent_activities_updated_at
  BEFORE UPDATE ON public.vendor_agent_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();