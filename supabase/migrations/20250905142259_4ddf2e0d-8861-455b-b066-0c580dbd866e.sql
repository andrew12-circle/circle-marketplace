-- Create agent questionnaire table
CREATE TABLE IF NOT EXISTS public.agent_questionnaires (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create DISC results table
CREATE TABLE IF NOT EXISTS public.disc_results (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE,
  status TEXT CHECK (status IN ('not_started','in_progress','completed')) DEFAULT 'not_started',
  disc_type TEXT,
  scores JSONB,
  method TEXT DEFAULT 'external',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on agent questionnaires
ALTER TABLE public.agent_questionnaires ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent questionnaires
CREATE POLICY "Users can manage their own questionnaire" 
ON public.agent_questionnaires 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all questionnaires" 
ON public.agent_questionnaires 
FOR SELECT 
USING (get_user_admin_status());

-- Enable RLS on DISC results
ALTER TABLE public.disc_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for DISC results
CREATE POLICY "Users can manage their own DISC results" 
ON public.disc_results 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert DISC results via token" 
ON public.disc_results 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update DISC results via token" 
ON public.disc_results 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_questionnaire_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_disc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_agent_questionnaires_updated_at
  BEFORE UPDATE ON public.agent_questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION public.update_questionnaire_updated_at();

CREATE TRIGGER update_disc_results_updated_at
  BEFORE UPDATE ON public.disc_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_disc_updated_at();