import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  step_name?: string;
  timestamp: Date;
}

interface ConversationState {
  sessionId: string | null;
  messages: Message[];
  currentStep: string;
  isComplete: boolean;
  quickReplies: string[];
  plan?: any;
}

export function useAIConcierge() {
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationState>({
    sessionId: null,
    messages: [],
    currentStep: 'welcome',
    isComplete: false,
    quickReplies: [],
    plan: null
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const startConversation = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to start your growth planning session.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-concierge-chat', {
        body: { action: 'start' }
      });

      if (error) throw error;

      setConversation({
        sessionId: data.sessionId,
        messages: [{
          id: '1',
          role: 'assistant',
          content: data.message,
          step_name: data.step,
          timestamp: new Date()
        }],
        currentStep: data.step,
        isComplete: false,
        quickReplies: data.quickReplies || [],
        plan: null
      });

    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start conversation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!conversation.sessionId || !user) return;

    setIsLoading(true);
    
    // Add user message to conversation
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      step_name: conversation.currentStep,
      timestamp: new Date()
    };

    setConversation(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    try {
      const { data, error } = await supabase.functions.invoke('ai-concierge-chat', {
        body: {
          action: 'respond',
          sessionId: conversation.sessionId,
          message,
          stepName: conversation.currentStep
        }
      });

      if (error) throw error;

      if (data.isComplete) {
        // Conversation finished - show plan
        setConversation(prev => ({
          ...prev,
          isComplete: true,
          plan: data.plan,
          quickReplies: []
        }));
      } else {
        // Continue conversation
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          step_name: data.step,
          timestamp: new Date()
        };

        setConversation(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          currentStep: data.step,
          quickReplies: data.quickReplies || []
        }));
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setConversation({
      sessionId: null,
      messages: [],
      currentStep: 'welcome',
      isComplete: false,
      quickReplies: [],
      plan: null
    });
  };

  const savePlanToProfile = async () => {
    if (!conversation.plan || !user) return;

    try {
      toast({
        title: "Plan saved",
        description: "Your growth plan has been saved to your profile.",
      });
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: "Failed to save plan to profile",
        variant: "destructive"
      });
    }
  };

  return {
    conversation,
    isLoading,
    startConversation,
    sendMessage,
    resetConversation,
    savePlanToProfile
  };
}