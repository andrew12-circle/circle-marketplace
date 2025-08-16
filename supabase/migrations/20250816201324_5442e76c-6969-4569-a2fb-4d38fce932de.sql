-- Create advanced help system tables for autonomous support

-- Table for tracking user issues and resolutions
CREATE TABLE public.help_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('technical', 'billing', 'account', 'feature', 'general')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'analyzing', 'resolved', 'escalated')),
  title TEXT NOT NULL,
  description TEXT,
  resolution TEXT,
  ai_confidence_score DECIMAL(3,2),
  auto_resolved BOOLEAN DEFAULT false,
  escalated_to_human BOOLEAN DEFAULT false,
  context_data JSONB,
  resolution_steps JSONB,
  user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for knowledge base that AI can reference
CREATE TABLE public.help_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  search_vectors tsvector,
  usage_count INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for AI learning from user interactions
CREATE TABLE public.help_ai_learning (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful', 'partially_helpful')),
  follow_up_questions TEXT[],
  resolution_achieved BOOLEAN DEFAULT false,
  context_data JSONB,
  learning_points JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for proactive help triggers
CREATE TABLE public.help_proactive_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('stuck_pattern', 'error_pattern', 'confusion_indicator', 'feature_discovery')),
  trigger_data JSONB NOT NULL,
  help_offered BOOLEAN DEFAULT false,
  help_accepted BOOLEAN DEFAULT false,
  resolution_successful BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.help_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_ai_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_proactive_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for help_issues
CREATE POLICY "Users can manage their own issues" 
ON public.help_issues 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all issues" 
ON public.help_issues 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
);

-- RLS Policies for knowledge base (public read for AI)
CREATE POLICY "Knowledge base is publicly readable" 
ON public.help_knowledge_base 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage knowledge base" 
ON public.help_knowledge_base 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
);

-- RLS Policies for AI learning
CREATE POLICY "AI learning data is restricted" 
ON public.help_ai_learning 
FOR ALL 
USING (false);

-- RLS Policies for proactive triggers
CREATE POLICY "Users can view their own triggers" 
ON public.help_proactive_triggers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert triggers for users" 
ON public.help_proactive_triggers 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_help_issues_user_id ON public.help_issues(user_id);
CREATE INDEX idx_help_issues_status ON public.help_issues(status);
CREATE INDEX idx_help_issues_type ON public.help_issues(issue_type);
CREATE INDEX idx_help_knowledge_base_search ON public.help_knowledge_base USING gin(search_vectors);
CREATE INDEX idx_help_knowledge_base_category ON public.help_knowledge_base(category);
CREATE INDEX idx_help_ai_learning_query ON public.help_ai_learning USING gin(to_tsvector('english', user_query));
CREATE INDEX idx_help_proactive_triggers_user ON public.help_proactive_triggers(user_id);

-- Function to update search vectors for knowledge base
CREATE OR REPLACE FUNCTION update_help_kb_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vectors := to_tsvector('english', NEW.title || ' ' || NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vectors
CREATE TRIGGER trigger_update_help_kb_search_vector
  BEFORE INSERT OR UPDATE ON public.help_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_help_kb_search_vector();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
CREATE TRIGGER trigger_help_issues_updated_at
  BEFORE UPDATE ON public.help_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial knowledge base entries
INSERT INTO public.help_knowledge_base (category, subcategory, title, content, tags) VALUES
('marketplace', 'search', 'How to search for services', 'Use the search bar at the top to find services. You can filter by category, location, price range, and ratings. Try using specific keywords related to your needs.', ARRAY['search', 'filter', 'marketplace']),
('marketplace', 'booking', 'How to book a service', 'Click on any service card to view details. Use the "Book Now" or "Contact Vendor" buttons to initiate booking. For consultations, you can schedule directly through the platform.', ARRAY['booking', 'consultation', 'vendor']),
('account', 'profile', 'Setting up your profile', 'Complete your profile by adding your business information, location, and specialties. This helps our AI provide better recommendations and connects you with relevant services.', ARRAY['profile', 'setup', 'recommendations']),
('academy', 'courses', 'Accessing learning materials', 'Visit the Academy section to access courses, videos, podcasts, and books. Use filters to find content relevant to your specialty and experience level.', ARRAY['academy', 'learning', 'courses']),
('billing', 'copay', 'Understanding co-pay system', 'Co-pay allows you to share service costs with other agents. When you refer business to vendors, you can earn credits that reduce your own service costs.', ARRAY['copay', 'billing', 'credits']);