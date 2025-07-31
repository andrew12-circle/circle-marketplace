-- Create login_lockouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.login_lockouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL,
  attempt_type text NOT NULL DEFAULT 'email',
  attempt_count integer NOT NULL DEFAULT 0,
  locked_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(identifier, attempt_type)
);

-- Enable RLS
ALTER TABLE public.login_lockouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System can manage lockouts" ON public.login_lockouts
FOR ALL USING (false) WITH CHECK (false);

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_login_lockouts_updated_at
  BEFORE UPDATE ON public.login_lockouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();