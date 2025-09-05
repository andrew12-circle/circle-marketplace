-- Ensure disc_results table exists with correct structure
DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'disc_results') THEN
    CREATE TABLE public.disc_results (
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
  END IF;
END
$$;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own DISC results" ON public.disc_results;
DROP POLICY IF EXISTS "Users can insert their own DISC results" ON public.disc_results;
DROP POLICY IF EXISTS "Users can update their own DISC results" ON public.disc_results;

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