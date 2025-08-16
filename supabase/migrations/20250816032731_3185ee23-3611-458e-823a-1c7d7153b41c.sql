-- Create app_config table for remote configuration and kill switches
CREATE TABLE public.app_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_build_version TEXT,
  force_cache_bust_after TIMESTAMP WITH TIME ZONE,
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access for app config
CREATE POLICY "App config is readable by everyone"
ON public.app_config
FOR SELECT
USING (true);

-- Only admins can modify app config
CREATE POLICY "Only admins can modify app config"
ON public.app_config
FOR ALL
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

-- Create incidents table for tracking outages
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  severity TEXT NOT NULL DEFAULT 'medium',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  details JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Allow public read access for current incidents
CREATE POLICY "Current incidents are readable by everyone"
ON public.incidents
FOR SELECT
USING (status = 'open');

-- Only admins can manage incidents
CREATE POLICY "Only admins can manage incidents"
ON public.incidents
FOR ALL
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

-- Add trigger for updated_at
CREATE TRIGGER update_app_config_updated_at
BEFORE UPDATE ON public.app_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default app config
INSERT INTO public.app_config (id, min_build_version) 
VALUES ('00000000-0000-0000-0000-000000000001', '1.0.0');