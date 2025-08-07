-- Create table for RESPA disclaimers
CREATE TABLE public.respa_disclaimers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  button_text TEXT DEFAULT 'Learn more',
  button_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.respa_disclaimers ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Disclaimers are viewable by everyone" 
ON public.respa_disclaimers 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage disclaimers" 
ON public.respa_disclaimers 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Add trigger for timestamps
CREATE TRIGGER update_respa_disclaimers_updated_at
BEFORE UPDATE ON public.respa_disclaimers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Circle COVERAGE disclaimer
INSERT INTO public.respa_disclaimers (title, content, button_text, button_url) VALUES (
  'Circle COVERAGE - Compliant Advertising Partnerships',
  'Find lenders and title companies & more interested in sharing the cost of public advertising campaigns. Each party pays their proportional share and receives proportional benefit in all advertising materials. This feature facilitates introductions for RESPA-compliant marketing partnerships only. Federal law prohibits cost-sharing arrangements for lead generation tools or business platforms.',
  'Learn more',
  '/legal/buyer-protection'
);