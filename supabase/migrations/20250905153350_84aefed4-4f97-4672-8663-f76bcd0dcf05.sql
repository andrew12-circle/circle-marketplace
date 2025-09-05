-- Create disc_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.disc_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disc_type TEXT,
  disc_scores JSONB,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  token TEXT,
  external_link TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.disc_results ENABLE ROW LEVEL SECURITY;

-- Create policies for DISC results
CREATE POLICY "Users can view their own DISC results" 
ON public.disc_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DISC results" 
ON public.disc_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DISC results" 
ON public.disc_results 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_disc_results_updated_at
BEFORE UPDATE ON public.disc_results
FOR EACH ROW
EXECUTE FUNCTION public.update_disc_updated_at();