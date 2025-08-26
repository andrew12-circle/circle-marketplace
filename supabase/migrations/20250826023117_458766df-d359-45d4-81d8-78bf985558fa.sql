-- Enable RLS on service_ai_knowledge table
ALTER TABLE public.service_ai_knowledge ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read active knowledge entries
CREATE POLICY "Public can read active service AI knowledge" 
ON public.service_ai_knowledge 
FOR SELECT 
USING (is_active = true);

-- Policy: Only admins can manage service AI knowledge
CREATE POLICY "Admins can manage service AI knowledge" 
ON public.service_ai_knowledge 
FOR ALL 
USING (get_user_admin_status() = true)
WITH CHECK (get_user_admin_status() = true);