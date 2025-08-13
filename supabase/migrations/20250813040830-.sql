-- Create retention_events table for tracking subscription retention efforts
CREATE TABLE public.retention_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.retention_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own retention events" 
ON public.retention_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert retention events" 
ON public.retention_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all retention events" 
ON public.retention_events 
FOR SELECT 
USING (get_user_admin_status());

-- Create index for performance
CREATE INDEX idx_retention_events_user_id ON public.retention_events(user_id);
CREATE INDEX idx_retention_events_type ON public.retention_events(event_type);
CREATE INDEX idx_retention_events_created_at ON public.retention_events(created_at);