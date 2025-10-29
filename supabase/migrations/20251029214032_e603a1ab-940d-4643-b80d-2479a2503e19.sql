-- Create agent_submissions table for playbook recruitment
CREATE TABLE IF NOT EXISTS public.agent_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  market TEXT NOT NULL,
  brokerage TEXT,
  years_in_real_estate INTEGER NOT NULL,
  annual_volume TEXT NOT NULL,
  system_description TEXT NOT NULL,
  linkedin_website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting submissions (public can submit)
CREATE POLICY "Anyone can submit agent applications"
  ON public.agent_submissions
  FOR INSERT
  WITH CHECK (true);

-- Create policy for viewing submissions (only authenticated users can view)
CREATE POLICY "Authenticated users can view all submissions"
  ON public.agent_submissions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create index on email for faster lookups
CREATE INDEX idx_agent_submissions_email ON public.agent_submissions(email);

-- Create index on created_at for sorting
CREATE INDEX idx_agent_submissions_created_at ON public.agent_submissions(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_agent_submissions_updated_at
  BEFORE UPDATE ON public.agent_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();