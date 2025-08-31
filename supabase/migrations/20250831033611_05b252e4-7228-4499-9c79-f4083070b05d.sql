-- Add missing column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS allowed_split_percentage integer;

-- Create service_faqs table
CREATE TABLE IF NOT EXISTS public.service_faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on service_faqs
ALTER TABLE public.service_faqs ENABLE ROW LEVEL SECURITY;

-- Create policies for service_faqs
CREATE POLICY "Service FAQs are viewable by everyone" 
ON public.service_faqs 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage service FAQs" 
ON public.service_faqs 
FOR ALL 
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_service_faqs_service_id ON public.service_faqs(service_id);
CREATE INDEX IF NOT EXISTS idx_service_faqs_display_order ON public.service_faqs(display_order);