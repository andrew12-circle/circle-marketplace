-- Create table for tracking AI batch processing status
CREATE TABLE IF NOT EXISTS public.ai_batch_status (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id TEXT NOT NULL UNIQUE,
    current_service TEXT,
    completed_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'started', 'processing', 'completed', 'completed_with_errors', 'failed')),
    errors JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_batch_status
ALTER TABLE public.ai_batch_status ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_batch_status
CREATE POLICY "Anyone can view batch status" 
ON public.ai_batch_status 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage batch status" 
ON public.ai_batch_status 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ai_batch_status_batch_id ON public.ai_batch_status(batch_id);
CREATE INDEX IF NOT EXISTS idx_ai_batch_status_status ON public.ai_batch_status(status);
CREATE INDEX IF NOT EXISTS idx_ai_batch_status_created_at ON public.ai_batch_status(created_at);