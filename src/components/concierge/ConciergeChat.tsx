import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Send, ThumbsUp, ThumbsDown, BookOpen, ExternalLink, Calendar, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConciergeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  trust?: {
    confidence: number;
    peer_patterns: string[];
  };
  citations?: Array<{
    title: string;
    source: 'marketplace' | 'kb';
    id: string;
  }>;
  actions?: Array<{
    label: string;
    action: 'view_services' | 'start_workflow' | 'open_link' | 'book_meeting';
    params: Record<string, any>;
  }>;
  quick_replies?: string[];
  handoff?: {
    suggest: boolean;
    reason?: string;
  };
}

const generateThreadId = () => {
  return crypto.randomUUID();
};

interface ConciergeChatProps {
  threadId?: string;
  onThreadChange?: (threadId: string) => void;
  initialMessage?: string;
}

export const ConciergeChat: React.FC<ConciergeChatProps> = ({ threadId: initialThreadId, onThreadChange, initialMessage }) => {
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(initialThreadId || generateThreadId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (threadId) {
      loadMessages(threadId);
    }
  }, [threadId]);

  // Handle initial message
  useEffect(() => {
    if (initialMessage && messages.length === 0 && !loading) {
      sendMessage(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const loadMessages = async (currentThreadId: string) => {
    try {
      let query = supabase
        .from('concierge_chat_messages')
        .select('*')
        .eq('thread_id', currentThreadId)
        .order('created_at', { ascending: true });

      // Only filter by user_id if user is authenticated
      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else {
        // For anonymous users, don't filter by user_id or filter for null
        query = query.is('user_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedMessages: ConciergeMessage[] = (data || []).map(msg => {
        if (msg.role === 'assistant') {
          try {
            const parsed = JSON.parse(msg.content);
            return {
              id: msg.id,
              role: msg.role,
              content: parsed.message || msg.content,
              created_at: msg.created_at,
              trust: parsed.trust,
              citations: parsed.citations,
              actions: parsed.actions,
              quick_replies: parsed.quick_replies,
              handoff: parsed.handoff
            };
          } catch {
            return {
              id: msg.id,
              role: msg.role,
              content: msg.content,
              created_at: msg.created_at
            };
          }
        }
        return {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at
        };
      });

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ConciergeMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Generate anon_id if user is not authenticated
      const anonId = user?.id || crypto.randomUUID();
      
      const { data, error } = await supabase.functions.invoke('concierge-respond', {
        body: {
          user_id: user?.id || null,
          anon_id: anonId,
          thread_id: threadId,
          text: text
        }
      });

      if (error) throw error;

      const assistantMessage: ConciergeMessage = {
        id: `response_${Date.now()}`,
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString(),
        trust: data.trust,
        citations: data.citations,
        actions: data.actions,
        quick_replies: data.quick_replies,
        handoff: data.handoff
      };

      setMessages(prev => [...prev.slice(0, -1), userMessage, assistantMessage]);
      
      if (onThreadChange) {
        onThreadChange(threadId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get response. Please try again.');
      setMessages(prev => prev.slice(0, -1)); // Remove the user message
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handleAction = async (action: ConciergeMessage['actions'][0]) => {
    switch (action.action) {
      case 'view_services':
        // Navigate to marketplace with filters
        window.location.href = `/marketplace?category=${action.params.category}`;
        break;
      case 'start_workflow':
        // Open workflow or checklist
        if (action.params.url) {
          window.open(action.params.url, '_blank');
        }
        break;
      case 'open_link':
        window.open(action.params.url, '_blank');
        break;
      case 'book_meeting':
        // Handle booking meeting
        toast.info('Booking feature coming soon!');
        break;
    }
  };

  const handleFeedback = async (messageId: string, helpful: boolean, reason?: string) => {
    try {
      await supabase.functions.invoke('concierge-feedback', {
        body: {
          user_id: user?.id,
          answer_id: messageId,
          helpful,
          reason
        }
      });
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const startNewConversation = () => {
    const newThreadId = generateThreadId();
    setThreadId(newThreadId);
    setMessages([]);
    if (onThreadChange) {
      onThreadChange(newThreadId);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Circle Agent Concierge</h2>
            <p className="text-sm text-muted-foreground">Your AI agent advisor</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={startNewConversation}>
          New Chat
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">How can I help you today?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              I'm here to help you find the right tools, services, and strategies to grow your real estate business.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "I need a CRM recommendation",
                "Best yard sign vendors?",
                "Help me build a listing presentation",
                "What's working for lead generation?"
              ].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
              
              {/* Trust metrics for assistant messages */}
              {message.role === 'assistant' && message.trust && (
                <div className="mt-2 pt-2 border-t border-border/20">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {message.trust.confidence}% confidence
                    </Badge>
                    {message.trust.peer_patterns[0] && (
                      <span>{message.trust.peer_patterns[0]}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Citations */}
              {message.citations && message.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/20">
                  <div className="flex flex-wrap gap-1">
                    {message.citations.map((citation, index) => (
                      <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                        {citation.source === 'marketplace' ? <ExternalLink className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                        {citation.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.actions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(action)}
                      className="text-xs"
                    >
                      {action.action === 'book_meeting' && <Calendar className="w-3 h-3 mr-1" />}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Quick replies */}
              {message.quick_replies && message.quick_replies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.quick_replies.map((reply, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuickReply(reply)}
                      className="text-xs border"
                    >
                      {reply}
                    </Button>
                  ))}
                </div>
              )}

              {/* Feedback buttons for assistant messages */}
              {message.role === 'assistant' && (
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback(message.id, true)}
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback(message.id, false)}
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Handoff suggestion */}
              {message.handoff?.suggest && (
                <Card className="mt-2">
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground mb-2">{message.handoff.reason}</p>
                    <Button
                      size="sm"
                      onClick={() => handleAction({ 
                        label: 'Book with an Agent Concierge', 
                        action: 'book_meeting', 
                        params: { source: 'concierge' }
                      })}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Book with Human Concierge
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about growing your real estate business..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
            disabled={loading}
          />
          <Button 
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-2">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 mr-1" />
            Book with Human Concierge
          </Button>
        </div>
      </div>
    </div>
  );
};