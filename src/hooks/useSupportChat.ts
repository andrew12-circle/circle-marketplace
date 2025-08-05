import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedAI } from '@/hooks/useEnhancedAI';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SupportMessage = Database['public']['Tables']['support_messages']['Row'];
type SupportConversation = Database['public']['Tables']['support_conversations']['Row'];
type SupportMessageInsert = Database['public']['Tables']['support_messages']['Insert'];

export const useSupportChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Analyze message for escalation triggers
  const analyzeForEscalation = useCallback((message: string): boolean => {
    const escalationKeywords = [
      'speak to human', 'talk to person', 'human agent', 
      'not working', 'broken', 'error', 'bug', 'problem',
      'billing issue', 'payment problem', 'refund',
      'cancel', 'delete account', 'frustrated', 'angry',
      'video call', 'phone call', 'schedule meeting'
    ];

    const lowerMessage = message.toLowerCase();
    return escalationKeywords.some(keyword => lowerMessage.includes(keyword));
  }, []);

  // Calculate AI confidence score
  const calculateConfidenceScore = useCallback((response: string): number => {
    if (response.includes('I don\'t know') || response.includes('I\'m not sure')) {
      return 0.3;
    }
    if (response.includes('contact support') || response.includes('human agent')) {
      return 0.4;
    }
    if (response.length < 50) {
      return 0.6;
    }
    return 0.8;
  }, []);

  // Add message to database
  const addMessage = useCallback(async (messageData: Partial<SupportMessageInsert>) => {
    if (!conversation) return;

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user?.id || null,
          message_content: messageData.message_content || '',
          sender_type: messageData.sender_type || 'user',
          message_type: messageData.message_type || 'text',
          attachments: messageData.attachments || [],
          metadata: messageData.metadata || {},
          ai_confidence_score: messageData.ai_confidence_score || null,
          is_escalation_trigger: messageData.is_escalation_trigger || false
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }, [conversation, user?.id]);

  // Add system message
  const addSystemMessage = useCallback(async (content: string) => {
    if (!conversation) return;

    await addMessage({
      sender_type: 'system',
      message_content: content,
      message_type: 'system_notification',
      metadata: { system_generated: true }
    });
  }, [conversation, addMessage]);

  // Escalate to human support
  const escalateToHuman = useCallback(async (reason: string, details: string) => {
    if (!conversation || !user?.id) return;

    try {
      // Update conversation status
      const { error: updateError } = await supabase
        .from('support_conversations')
        .update({
          status: 'escalated',
          conversation_type: 'escalated',
          escalation_reason: reason,
          escalated_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

      if (updateError) throw updateError;

      // Create escalation record
      const { error: escalationError } = await supabase
        .from('support_escalations')
        .insert({
          conversation_id: conversation.id,
          escalated_from: 'ai',
          escalation_reason: details,
          escalated_by: user.id,
          escalation_priority: conversation.priority,
          context_data: {
            escalation_reason: reason,
            user_context: {
              user_id: user.id,
              conversation_length: messages.length
            }
          }
        });

      if (escalationError) throw escalationError;

      // Add system message about escalation
      await addSystemMessage(
        `I've connected you with a human support specialist who can provide more detailed assistance. They'll review our conversation and respond shortly. For complex issues, they may schedule a video call to better help you.`
      );

      // Update local state
      setConversation(prev => prev ? { 
        ...prev, 
        status: 'escalated' as const,
        conversation_type: 'escalated' as const,
        escalation_reason: reason,
        escalated_at: new Date().toISOString()
      } : null);

      toast({
        title: "Connected to Human Support",
        description: "A support specialist will be with you shortly.",
      });
    } catch (error) {
      console.error('Error escalating to human:', error);
      toast({
        title: "Error",
        description: "Failed to connect to human support. Please try again.",
        variant: "destructive",
      });
    }
  }, [conversation, user?.id, messages, addSystemMessage, toast]);

  // Handle AI response
  const handleAIResponse = useCallback(async (response: string) => {
    if (!conversation) return;

    try {
      // Analyze response for escalation triggers
      const shouldEscalate = analyzeForEscalation(response);
      const confidenceScore = calculateConfidenceScore(response);

      await addMessage({
        sender_type: 'ai',
        message_content: response,
        message_type: 'text',
        ai_confidence_score: confidenceScore,
        is_escalation_trigger: shouldEscalate,
        metadata: { 
          response_time: Date.now(),
          analysis: { shouldEscalate, confidenceScore }
        }
      });

      // Auto-escalate if confidence is low or escalation triggers detected
      if (shouldEscalate || confidenceScore < 0.5) {
        setTimeout(() => {
          escalateToHuman('low_confidence', 'AI confidence below threshold or escalation triggers detected');
        }, 2000);
      }
    } catch (error) {
      console.error('Error handling AI response:', error);
    }
  }, [conversation, addMessage, analyzeForEscalation, calculateConfidenceScore, escalateToHuman]);

  const { getRecommendation, isLoading: aiLoading } = useEnhancedAI({
    onSuccess: (recommendation) => {
      handleAIResponse(recommendation);
    },
    onError: (error) => {
      console.error('AI Error:', error);
      addSystemMessage('I apologize, but I encountered an error. A support agent will be with you shortly.');
      escalateToHuman('ai_error', 'AI service encountered an error');
    }
  });

  // Load messages for conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // Count unread messages
      const unread = data?.filter(msg => 
        msg.sender_type !== 'user' && !msg.read_at
      ).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Create or get active conversation
  const initializeConversation = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Check for existing active conversation
      const { data: existingConversations, error: fetchError } = await supabase
        .from('support_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      let activeConversation = existingConversations?.[0];

      if (!activeConversation) {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('support_conversations')
          .insert({
            user_id: user.id,
            conversation_type: 'ai',
            status: 'active',
            priority: 'normal',
            category: 'general',
            metadata: { started_at: new Date().toISOString() }
          })
          .select()
          .single();

        if (createError) throw createError;
        activeConversation = newConversation;

        // Add welcome message
        await addMessage({
          conversation_id: activeConversation.id,
          sender_type: 'ai',
          message_content: `Hello! I'm your AI support assistant. I can help you with:

• Technical questions and troubleshooting
• Account and billing inquiries  
• Platform navigation and features
• General questions about our services

If I can't fully resolve your issue, I'll connect you with a human specialist who can schedule a video call if needed.

How can I help you today?`,
          message_type: 'text',
          ai_confidence_score: 1.0,
          metadata: { is_welcome: true }
        });
      }

      setConversation(activeConversation);
      await loadMessages(activeConversation.id);
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start support chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast, addMessage, loadMessages]);

  // Send user message
  const sendMessage = useCallback(async (content: string) => {
    if (!conversation || !content.trim()) return;

    try {
      setIsLoading(true);

      // Add user message
      await addMessage({
        sender_type: 'user',
        message_content: content.trim(),
        message_type: 'text'
      });

      // Get AI response with context about the conversation
      const context = {
        currentPage: 'support_chat',
        conversationId: conversation.id,
        conversationType: conversation.conversation_type,
        category: conversation.category,
        previousMessages: messages.slice(-5) // Last 5 messages for context
      };

      await getRecommendation(content, context);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversation, messages, addMessage, getRecommendation, toast]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversation) return;

    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversation.id)
        .is('read_at', null)
        .neq('sender_type', 'user');

      if (error) throw error;

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [conversation]);

  // Open chat widget
  const openChat = useCallback(async () => {
    setIsOpen(true);
    if (!conversation && user?.id) {
      await initializeConversation();
    }
    if (conversation) {
      await markAsRead();
    }
  }, [conversation, user?.id, initializeConversation, markAsRead]);

  // Close chat widget
  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Initialize conversation when user is available
  useEffect(() => {
    if (user?.id && isOpen && !conversation) {
      initializeConversation();
    }
  }, [user?.id, isOpen, conversation, initializeConversation]);

  return {
    // State
    conversation,
    messages,
    isLoading: isLoading || aiLoading,
    isOpen,
    unreadCount,

    // Actions
    sendMessage,
    escalateToHuman,
    openChat,
    closeChat,
    markAsRead,
    initializeConversation
  };
};