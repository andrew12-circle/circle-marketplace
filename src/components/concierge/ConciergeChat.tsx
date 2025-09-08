import { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, Calendar, ExternalLink, BookOpen, MessageSquare, Sparkles, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ConsultationBookingModal } from '@/components/marketplace/ConsultationBookingModal';

interface ConciergeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  trust?: {
    confidence: number;
    peers: number;
  };
  citations?: Array<{
    title: string;
    source: string;
    url?: string;
  }>;
  actions?: Array<{
    action: string;
    label: string;
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
  const [feedbackStates, setFeedbackStates] = useState<Record<string, { helpful?: boolean; showCorrection?: boolean; correction?: string }>>({});
  const [showBookAdvisor, setShowBookAdvisor] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Mock service for Circle team consultation
  const circleConsultationService = {
    id: 'circle-consultation',
    title: 'Circle Team Consultation',
    vendor: {
      name: 'Circle Marketplace Team'
    }
  };

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
        // For anonymous users, we can't filter by user_id as it will be null
        console.log('Loading messages for anonymous user');
      }

      const { data: dbMessages, error } = await query;

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      if (dbMessages && dbMessages.length > 0) {
        const formattedMessages: ConciergeMessage[] = dbMessages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          trust: msg.metadata?.trust,
          citations: msg.metadata?.citations,
          actions: msg.metadata?.actions,
          quick_replies: msg.metadata?.quick_replies,
          handoff: msg.metadata?.handoff
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error in loadMessages:', error);
    }
  };

  const sendMessage = async (messageText: string = input) => {
    if (!messageText.trim()) return;

    const userMessage: ConciergeMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('concierge-respond', {
        body: {
          user_id: user?.id || null,
          anon_id: user?.id ? null : 'anon_' + Date.now(),
          thread_id: threadId,
          text: messageText
        }
      });

      if (error) throw error;

      const assistantMessage: ConciergeMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        trust: data.trust,
        citations: data.citations,
        actions: data.actions,
        quick_replies: data.quick_replies,
        handoff: data.handoff
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: ConciergeMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handleAction = (action: any) => {
    switch (action.action) {
      case 'view_services':
        // Navigate to marketplace with filters
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
        break;
      case 'book_meeting':
        // Open booking modal
        window.open(action.params?.booking_url || '/book-meeting', '_blank');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    setFeedbackStates(prev => ({
      ...prev,
      [messageId]: { 
        helpful: isHelpful,
        showCorrection: !isHelpful,
        correction: ''
      }
    }));

    try {
      await supabase.functions.invoke('concierge-feedback', {
        body: {
          message_id: messageId,
          helpful: isHelpful,
          user_id: user?.id
        }
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const submitFeedbackCorrection = async (messageId: string) => {
    const correction = feedbackStates[messageId]?.correction;
    if (!correction?.trim()) return;

    try {
      await supabase.functions.invoke('concierge-feedback', {
        body: {
          message_id: messageId,
          helpful: false,
          correction: correction,
          user_id: user?.id
        }
      });

      setFeedbackStates(prev => ({
        ...prev,
        [messageId]: { 
          ...prev[messageId],
          showCorrection: false
        }
      }));
    } catch (error) {
      console.error('Error submitting correction:', error);
    }
  };

  const startNewConversation = () => {
    const newThreadId = generateThreadId();
    setThreadId(newThreadId);
    onThreadChange?.(newThreadId);
    setMessages([]);
    setInput('');
    setFeedbackStates({});
  };

  // Trust indicator component
  const TrustIndicator = ({ trust, className = "" }: { trust?: { confidence: number; peers: number }, className?: string }) => {
    if (!trust || trust.peers === 0) return null;

    return (
      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>{trust.peers} peer insights</span>
        </div>
      </div>
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">How can I help you today?</h3>
            <div className="max-w-[80%] mx-auto">
              <p className="text-muted-foreground mb-6">
                I'm here to help you find the right tools, services, and strategies to grow your real estate business.
              </p>
            </div>
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
          <div key={message.id} className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] ${
              message.role === 'user' 
                ? 'bg-blue-500 text-white rounded-2xl rounded-br-md' 
                : 'bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-200'
            } px-4 py-3 shadow-sm`}>
              <p className="text-[15px] leading-[1.4] whitespace-pre-wrap">{message.content}</p>

              {/* Citations */}
              {message.citations && message.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex flex-wrap gap-2">
                    {message.citations.map((citation, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs bg-white/20 text-current border-0 hover:bg-white/30"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
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
                      className="text-xs bg-white/10 border-white/30 text-current hover:bg-white/20"
                    >
                      {action.action === 'book_meeting' && <Calendar className="w-3 h-3 mr-1" />}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Feedback buttons for assistant messages */}
              {message.role === 'assistant' && (
                <div className="mt-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFeedback(message.id, true)}
                      className={`h-7 w-7 p-0 rounded-full transition-colors ${
                        feedbackStates[message.id]?.helpful === true 
                          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                          : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFeedback(message.id, false)}
                      className={`h-7 w-7 p-0 rounded-full transition-colors ${
                        feedbackStates[message.id]?.helpful === false 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Feedback correction form */}
                  {feedbackStates[message.id]?.showCorrection && (
                    <div className="mt-3 p-3 bg-white/50 rounded-xl border border-gray-200">
                      <Textarea
                        placeholder="What could be improved?"
                        value={feedbackStates[message.id]?.correction || ''}
                        onChange={(e) => setFeedbackStates(prev => ({
                          ...prev,
                          [message.id]: { ...prev[message.id], correction: e.target.value }
                        }))}
                        className="min-h-[60px] text-sm bg-transparent border-0 p-0 resize-none focus-visible:ring-0"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          onClick={() => submitFeedbackCorrection(message.id)}
                          className="h-7 px-3 text-xs"
                        >
                          Submit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setFeedbackStates(prev => ({
                            ...prev,
                            [message.id]: { ...prev[message.id], showCorrection: false }
                          }))}
                          className="h-7 px-3 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Trust indicator for assistant messages */}
              {message.role === 'assistant' && (
                <TrustIndicator 
                  trust={message.trust} 
                  className="mt-3 pt-2 border-t border-white/20" 
                />
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white text-gray-900 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-[75%] border border-gray-200">
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

      {/* Quick Replies */}
      {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.quick_replies && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex flex-wrap gap-2">
            {messages[messages.length - 1].quick_replies.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickReply(reply)}
                className="text-xs"
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            disabled={loading}
          />
          <Button 
            onClick={() => sendMessage()} 
            disabled={!input.trim() || loading}
            size="sm"
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex justify-center mt-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowBookAdvisor(true)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Phone className="w-3 h-3" />
            Book Human Advisor
          </Button>
        </div>
      </div>

      <ConsultationBookingModal 
        isOpen={showBookAdvisor}
        onClose={() => setShowBookAdvisor(false)}
        service={circleConsultationService}
        onBookingConfirmed={(consultationId) => {
          console.log('Consultation booked:', consultationId);
          setShowBookAdvisor(false);
        }}
      />
    </div>
  );
};