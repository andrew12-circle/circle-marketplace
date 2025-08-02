-- Create table for AI recommendation logging
CREATE TABLE public.ai_recommendation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  question TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  context_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_recommendation_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own recommendation history" 
ON public.ai_recommendation_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create recommendation logs" 
ON public.ai_recommendation_log 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all recommendation logs" 
ON public.ai_recommendation_log 
FOR SELECT 
USING (get_user_admin_status());

-- Create index for performance
CREATE INDEX idx_ai_recommendation_log_user_id ON public.ai_recommendation_log(user_id);
CREATE INDEX idx_ai_recommendation_log_created_at ON public.ai_recommendation_log(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_recommendation_log_updated_at
  BEFORE UPDATE ON public.ai_recommendation_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();