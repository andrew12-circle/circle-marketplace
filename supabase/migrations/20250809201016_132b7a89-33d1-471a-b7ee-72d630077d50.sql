-- Add funnel customization fields to vendors table
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS funnel_enabled boolean DEFAULT false;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS brand_colors jsonb DEFAULT '{"primary": "#3b82f6", "secondary": "#64748b", "accent": "#06b6d4"}'::jsonb;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS hero_banner_url text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS value_statement text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS custom_cta_text text DEFAULT 'Get Started';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS funnel_template_id uuid;

-- Create funnel_templates table for template variations
CREATE TABLE IF NOT EXISTS public.funnel_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name text NOT NULL,
  template_description text,
  industry_type text,
  layout_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on funnel_templates
ALTER TABLE public.funnel_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for funnel_templates
CREATE POLICY "Funnel templates are viewable by everyone" 
ON public.funnel_templates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage funnel templates" 
ON public.funnel_templates 
FOR ALL 
USING (get_user_admin_status());

-- Create vendor_qa table for Q&A section
CREATE TABLE IF NOT EXISTS public.vendor_qa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES auth.users(id),
  question text NOT NULL,
  answer text,
  is_answered boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on vendor_qa
ALTER TABLE public.vendor_qa ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_qa
CREATE POLICY "Q&A are viewable by everyone" 
ON public.vendor_qa 
FOR SELECT 
USING (true);

CREATE POLICY "Agents can create questions" 
ON public.vendor_qa 
FOR INSERT 
WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Vendors can answer their questions" 
ON public.vendor_qa 
FOR UPDATE 
USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

-- Insert default funnel templates
INSERT INTO public.funnel_templates (template_name, template_description, industry_type, layout_config) VALUES
('Standard Service', 'Default template for service providers', 'general', '{"hero_style": "minimal", "cta_style": "primary"}'::jsonb),
('Real Estate', 'Optimized for real estate professionals', 'real_estate', '{"hero_style": "professional", "cta_style": "accent"}'::jsonb),
('Marketing Agency', 'Template for marketing agencies', 'marketing', '{"hero_style": "creative", "cta_style": "gradient"}'::jsonb);