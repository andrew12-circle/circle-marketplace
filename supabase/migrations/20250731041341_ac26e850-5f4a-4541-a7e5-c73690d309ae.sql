-- Add columns to services table for vector image support
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS vectorized_image_url TEXT,
ADD COLUMN IF NOT EXISTS original_image_url TEXT;

-- Create table to track image processing
CREATE TABLE IF NOT EXISTS public.image_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'processing')),
  original_url TEXT,
  vectorized_url TEXT,
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the processing log table
ALTER TABLE public.image_processing_log ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view processing logs
CREATE POLICY "Admins can view processing logs"
ON public.image_processing_log
FOR SELECT
USING (get_user_admin_status());

-- Create policy for system to insert processing logs
CREATE POLICY "System can insert processing logs"
ON public.image_processing_log
FOR INSERT
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_vectorized_image ON public.services(vectorized_image_url);
CREATE INDEX IF NOT EXISTS idx_services_original_image ON public.services(original_image_url);
CREATE INDEX IF NOT EXISTS idx_processing_log_service_id ON public.image_processing_log(service_id);
CREATE INDEX IF NOT EXISTS idx_processing_log_status ON public.image_processing_log(status);
CREATE INDEX IF NOT EXISTS idx_processing_log_processed_at ON public.image_processing_log(processed_at DESC);