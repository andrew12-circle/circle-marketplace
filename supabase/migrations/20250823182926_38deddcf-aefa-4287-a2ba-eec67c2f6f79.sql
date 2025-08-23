-- Create service AI knowledge table
CREATE TABLE public.service_ai_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  knowledge_type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_ai_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage service AI knowledge"
ON public.service_ai_knowledge
FOR ALL
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

CREATE POLICY "Service AI knowledge is viewable by authenticated users"
ON public.service_ai_knowledge
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Create index for better performance
CREATE INDEX idx_service_ai_knowledge_service_id ON public.service_ai_knowledge(service_id);
CREATE INDEX idx_service_ai_knowledge_tags ON public.service_ai_knowledge USING GIN(tags);

-- Create trigger for updated_at
CREATE TRIGGER update_service_ai_knowledge_updated_at
  BEFORE UPDATE ON public.service_ai_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();