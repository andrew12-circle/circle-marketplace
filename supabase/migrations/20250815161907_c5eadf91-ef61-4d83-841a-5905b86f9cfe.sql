-- Drop existing vendor_questions table and recreate with standardized structure
DROP TABLE IF EXISTS public.vendor_questions CASCADE;

-- Create standardized vendor questions table
CREATE TABLE public.vendor_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  question_number INTEGER NOT NULL CHECK (question_number >= 1 AND question_number <= 8),
  question_text TEXT NOT NULL,
  answer_text TEXT,
  ai_generated BOOLEAN DEFAULT false,
  manually_updated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, question_number)
);

-- Enable RLS
ALTER TABLE public.vendor_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Vendor questions are viewable by everyone" 
ON public.vendor_questions FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage vendor questions" 
ON public.vendor_questions FOR ALL 
USING (get_user_admin_status());

CREATE POLICY "Vendors can view their own questions" 
ON public.vendor_questions FOR SELECT 
USING (auth.uid() = vendor_id);

-- Create updated_at trigger
CREATE TRIGGER update_vendor_questions_updated_at
  BEFORE UPDATE ON public.vendor_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to seed standardized questions for a vendor
CREATE OR REPLACE FUNCTION public.seed_standardized_vendor_questions(p_vendor_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.vendor_questions (vendor_id, question_number, question_text) VALUES
    (p_vendor_id, 1, 'Service & Reliability'),
    (p_vendor_id, 2, 'Communication & Availability'),
    (p_vendor_id, 3, 'Coverage & Licensing'),
    (p_vendor_id, 4, 'Product & Offering'),
    (p_vendor_id, 5, 'Reputation & Proof'),
    (p_vendor_id, 6, 'Local Presence'),
    (p_vendor_id, 7, 'Value Add & Differentiators'),
    (p_vendor_id, 8, 'Compliance & Professionalism')
  ON CONFLICT (vendor_id, question_number) DO NOTHING;
END;
$$;

-- Seed questions for existing vendors
DO $$
DECLARE
  vendor_record RECORD;
BEGIN
  FOR vendor_record IN SELECT id FROM public.vendors
  LOOP
    PERFORM public.seed_standardized_vendor_questions(vendor_record.id);
  END LOOP;
END $$;

-- Create trigger to auto-seed questions for new vendors
CREATE OR REPLACE FUNCTION public.auto_seed_vendor_questions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.seed_standardized_vendor_questions(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_seed_vendor_questions_trigger
  AFTER INSERT ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_seed_vendor_questions();