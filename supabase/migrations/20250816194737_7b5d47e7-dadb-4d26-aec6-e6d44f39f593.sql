-- Create help analytics table for tracking user help interactions
CREATE TABLE public.help_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('start', 'complete', 'skip', 'click')),
  guide_id TEXT,
  route TEXT NOT NULL,
  context_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.help_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own help analytics" 
ON public.help_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own help analytics" 
ON public.help_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all help analytics
CREATE POLICY "Admins can view all help analytics" 
ON public.help_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
);

-- Create index for performance
CREATE INDEX idx_help_analytics_user_id ON public.help_analytics(user_id);
CREATE INDEX idx_help_analytics_event_type ON public.help_analytics(event_type);
CREATE INDEX idx_help_analytics_route ON public.help_analytics(route);
CREATE INDEX idx_help_analytics_created_at ON public.help_analytics(created_at);