-- Support System Infrastructure
-- Create tables for comprehensive AI-powered help system

-- Support conversations table
CREATE TABLE public.support_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL DEFAULT 'ai' CHECK (conversation_type IN ('ai', 'human', 'escalated')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT CHECK (category IN ('technical', 'billing', 'general', 'onboarding', 'bug_report')),
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  escalation_reason TEXT,
  resolution_summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  escalated_at TIMESTAMP WITH TIME ZONE
);

-- Support messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai', 'agent', 'system')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message_content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system_notification')),
  attachments JSONB DEFAULT '[]',
  ai_confidence_score NUMERIC CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
  is_escalation_trigger BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE
);

-- Support agents table
CREATE TABLE public.support_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  agent_name TEXT NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  availability_status TEXT NOT NULL DEFAULT 'offline' CHECK (availability_status IN ('online', 'busy', 'away', 'offline')),
  current_conversations INTEGER DEFAULT 0,
  max_conversations INTEGER DEFAULT 5,
  average_rating NUMERIC DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  languages TEXT[] DEFAULT '{"en"}',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Support escalations table
CREATE TABLE public.support_escalations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  escalated_from TEXT NOT NULL CHECK (escalated_from IN ('ai', 'user_request', 'agent_request', 'system')),
  escalation_reason TEXT NOT NULL,
  escalated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.support_agents(id) ON DELETE SET NULL,
  escalation_priority TEXT NOT NULL DEFAULT 'normal' CHECK (escalation_priority IN ('low', 'normal', 'high', 'urgent')),
  context_data JSONB DEFAULT '{}',
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Support knowledge base table
CREATE TABLE public.support_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  search_keywords TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Zoom integrations table
CREATE TABLE public.zoom_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  meeting_id TEXT NOT NULL,
  meeting_url TEXT NOT NULL,
  passcode TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attendee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  meeting_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (meeting_status IN ('scheduled', 'started', 'ended', 'cancelled')),
  recording_url TEXT,
  meeting_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support analytics table for tracking performance
CREATE TABLE public.support_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  ai_resolved_conversations INTEGER DEFAULT 0,
  human_resolved_conversations INTEGER DEFAULT 0,
  escalation_rate NUMERIC DEFAULT 0,
  average_response_time_seconds INTEGER DEFAULT 0,
  average_resolution_time_seconds INTEGER DEFAULT 0,
  satisfaction_average NUMERIC DEFAULT 0,
  total_zoom_meetings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoom_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_conversations
CREATE POLICY "Users can view their own conversations" ON public.support_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON public.support_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.support_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Support agents can view assigned conversations" ON public.support_conversations
  FOR SELECT USING (
    auth.uid() = agent_id OR 
    EXISTS (SELECT 1 FROM public.support_agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Support agents can update assigned conversations" ON public.support_conversations
  FOR UPDATE USING (
    auth.uid() = agent_id OR 
    EXISTS (SELECT 1 FROM public.support_agents WHERE user_id = auth.uid())
  );

-- RLS Policies for support_messages
CREATE POLICY "Users can view messages in their conversations" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_conversations 
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON public.support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_conversations 
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Support agents can view all messages" ON public.support_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Support agents can create messages" ON public.support_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_agents WHERE user_id = auth.uid())
  );

-- RLS Policies for support_agents
CREATE POLICY "Support agents can view all agents" ON public.support_agents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Agents can update their own profile" ON public.support_agents
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for knowledge base
CREATE POLICY "Everyone can view public knowledge base" ON public.support_knowledge_base
  FOR SELECT USING (is_public = true);

CREATE POLICY "Support agents can manage knowledge base" ON public.support_knowledge_base
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.support_agents WHERE user_id = auth.uid())
  );

-- RLS Policies for zoom integrations
CREATE POLICY "Users can view their zoom meetings" ON public.zoom_integrations
  FOR SELECT USING (
    auth.uid() = host_id OR 
    auth.uid() = attendee_id OR
    EXISTS (
      SELECT 1 FROM public.support_conversations 
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Support agents can manage zoom meetings" ON public.zoom_integrations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.support_agents WHERE user_id = auth.uid())
  );

-- RLS Policies for support analytics
CREATE POLICY "Support agents can view analytics" ON public.support_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_agents WHERE user_id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX idx_support_conversations_user_id ON public.support_conversations(user_id);
CREATE INDEX idx_support_conversations_status ON public.support_conversations(status);
CREATE INDEX idx_support_conversations_created_at ON public.support_conversations(created_at);
CREATE INDEX idx_support_messages_conversation_id ON public.support_messages(conversation_id);
CREATE INDEX idx_support_messages_created_at ON public.support_messages(created_at);
CREATE INDEX idx_support_agents_user_id ON public.support_agents(user_id);
CREATE INDEX idx_support_agents_availability ON public.support_agents(availability_status);
CREATE INDEX idx_support_escalations_conversation_id ON public.support_escalations(conversation_id);
CREATE INDEX idx_zoom_integrations_conversation_id ON public.zoom_integrations(conversation_id);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_support_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_support_conversations_updated_at
  BEFORE UPDATE ON public.support_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_support_updated_at();

CREATE TRIGGER update_support_agents_updated_at
  BEFORE UPDATE ON public.support_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_support_updated_at();

CREATE TRIGGER update_zoom_integrations_updated_at
  BEFORE UPDATE ON public.zoom_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_support_updated_at();

CREATE TRIGGER update_support_knowledge_base_updated_at
  BEFORE UPDATE ON public.support_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_support_updated_at();