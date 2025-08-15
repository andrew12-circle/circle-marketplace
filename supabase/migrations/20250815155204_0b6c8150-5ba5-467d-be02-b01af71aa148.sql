-- Create vendor_questions table
CREATE TABLE public.vendor_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, question_number)
);

-- Enable RLS
ALTER TABLE public.vendor_questions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Vendors can view their own questions" 
ON public.vendor_questions 
FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own questions" 
ON public.vendor_questions 
FOR UPDATE 
USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all vendor questions" 
ON public.vendor_questions 
FOR ALL 
USING (get_user_admin_status());

-- Function to seed default questions for a vendor
CREATE OR REPLACE FUNCTION public.seed_vendor_questions(p_vendor_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.vendor_questions (vendor_id, question_number, question_text) VALUES
    (p_vendor_id, 1, 'What is your typical response time for new client inquiries?'),
    (p_vendor_id, 2, 'Do you provide 24/7 customer support or emergency services?'),
    (p_vendor_id, 3, 'What geographic areas do you currently serve?'),
    (p_vendor_id, 4, 'What is your average project completion timeline?'),
    (p_vendor_id, 5, 'Do you offer any guarantees or warranties on your services?'),
    (p_vendor_id, 6, 'What payment methods and terms do you accept?'),
    (p_vendor_id, 7, 'Can you provide references from recent clients?')
  ON CONFLICT (vendor_id, question_number) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;