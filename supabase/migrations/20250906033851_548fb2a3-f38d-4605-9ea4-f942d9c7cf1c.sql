-- Create tables for AI Concierge conversational flow
CREATE TABLE public.concierge_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_data JSONB NOT NULL DEFAULT '{}',
  current_step TEXT NOT NULL DEFAULT 'welcome',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.concierge_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own concierge sessions"
  ON public.concierge_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.concierge_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.concierge_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  step_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.concierge_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view messages from their sessions"
  ON public.concierge_messages
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.concierge_sessions
    WHERE concierge_sessions.id = concierge_messages.session_id
    AND concierge_sessions.user_id = auth.uid()
  ));

CREATE POLICY "System can insert messages"
  ON public.concierge_messages
  FOR INSERT
  WITH CHECK (true);

CREATE TABLE public.ai_growth_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.concierge_sessions(id) ON DELETE SET NULL,
  plan_data JSONB NOT NULL,
  recommended_service_ids UUID[] NOT NULL DEFAULT '{}',
  confidence_score INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_growth_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own growth plans"
  ON public.ai_growth_plans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_concierge_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_concierge_sessions_updated_at
  BEFORE UPDATE ON public.concierge_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_concierge_session_updated_at();

CREATE TRIGGER update_ai_growth_plans_updated_at
  BEFORE UPDATE ON public.ai_growth_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_concierge_session_updated_at();