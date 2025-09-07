import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  Paperclip, 
  X, 
  ExternalLink,
  Calendar,
  ShoppingCart,
  FileText,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

interface CircleConciergeChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function CircleConciergeChat({ 
  isOpen, 
  onClose, 
  initialMessage, 
  isMinimized = false,
  onToggleMinimize 
}: CircleConciergeChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId] = useState(() => `thread_${Date.now()}`);
  const [currentQuickReplies, setCurrentQuickReplies] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && initialMessage && messages.length === 0) {
      handleSendMessage(initialMessage);
    }
  }, [isOpen, initialMessage]);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentQuickReplies([]);

    try {
      const { data, error } = await supabase.functions.invoke('concierge-respond', {
        body: {
          user_id: user.id,
          thread_id: threadId,
          text: text.trim()
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
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
      setCurrentQuickReplies(data.quick_replies || []);

      // Show handoff suggestion if needed
      if (data.handoff?.suggest) {
        toast({
          title: "Human assistance recommended",
          description: data.handoff.reason,
          duration: 5000
        });
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });

      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const handleAction = (action: any) => {
    switch (action.action) {
      case 'view_services':
        // Navigate to marketplace with filters
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
        break;
      case 'book_meeting':
        // Open booking modal
        toast({
          title: "Booking system",
          description: "Human consultation booking would open here",
        });
        break;
      case 'open_link':
        window.open(action.params.url, '_blank');
        break;
      case 'start_workflow':
        toast({
          title: "Workflow system",
          description: `Starting ${action.params.type} workflow`,
        });
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

      toast({
        title: helpful ? "Thanks for the feedback!" : "Feedback received",
        description: helpful ? "Glad we could help!" : "We'll use this to improve.",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'view_services': return <ShoppingCart className="h-4 w-4" />;
      case 'book_meeting': return <Calendar className="h-4 w-4" />;
      case 'start_workflow': return <FileText className="h-4 w-4" />;
      case 'open_link': return <ExternalLink className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  const TrustIndicator = ({ trust }: { trust: Message['trust'] }) => {
    if (!trust) return null;
    
    const getConfidenceColor = (confidence: number) => {
      if (confidence >= 70) return 'text-green-600';
      if (confidence >= 50) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
        <div className="flex items-center justify-between">
          <span className={`font-medium ${getConfidenceColor(trust.confidence)}`}>
            Confidence: {trust.confidence}%
          </span>
        </div>
        {trust.peer_patterns.length > 0 && (
          <div className="mt-1">
            <span className="font-medium">Peer insight:</span> {trust.peer_patterns[0]}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className={`w-full sm:w-[500px] p-0 flex flex-col ${isMinimized ? 'h-16' : 'h-full'}`}
      >
        <SheetHeader className="flex flex-row items-center justify-between p-4 border-b">
          <SheetTitle className="text-left">Circle Agent Concierge</SheetTitle>
          <div className="flex items-center gap-2">
            {onToggleMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <Card className={`max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <CardContent className="p-3">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Trust indicator for assistant messages */}
                        {message.role === 'assistant' && message.trust && (
                          <TrustIndicator trust={message.trust} />
                        )}

                        {/* Citations */}
                        {message.citations && message.citations.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.citations.map((citation, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {citation.title}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.actions.map((action, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction(action)}
                                className="w-full justify-start text-xs"
                              >
                                {getActionIcon(action.action)}
                                {action.label}
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
                              className="h-6 px-2"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeedback(message.id, false)}
                              className="h-6 px-2"
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <Card className="bg-muted">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="animate-pulse">Thinking...</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {currentQuickReplies.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {currentQuickReplies.map((reply, idx) => (
                    <Button
                      key={idx}
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

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask about CRM, marketing, lead gen..."
                    className="min-h-[60px] resize-none"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  className="h-12 w-12 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}