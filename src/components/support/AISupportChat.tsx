import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Clock, AlertTriangle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSupportChat } from '@/hooks/useSupportChat';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export const AISupportChat = () => {
  const { user } = useAuth();
  const { 
    conversation, 
    messages, 
    isLoading, 
    sendMessage, 
    escalateToHuman,
    markAsRead 
  } = useSupportChat();
  
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when component mounts or messages change
    markAsRead();
  }, [messages, markAsRead]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const message = inputValue.trim();
    setInputValue('');
    
    await sendMessage(message);
    
    // Focus back to input
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEscalateToHuman = () => {
    escalateToHuman('user_request', 'User manually requested human support');
  };

  const getMessageIcon = (senderType: string) => {
    switch (senderType) {
      case 'ai':
        return <Bot className="h-4 w-4 text-primary" />;
      case 'user':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'agent':
        return <User className="h-4 w-4 text-green-600" />;
      case 'system':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getMessageBubbleClass = (senderType: string) => {
    switch (senderType) {
      case 'user':
        return 'bg-primary text-primary-foreground ml-8';
      case 'ai':
        return 'bg-muted text-muted-foreground mr-8';
      case 'agent':
        return 'bg-green-100 text-green-900 mr-8';
      case 'system':
        return 'bg-orange-100 text-orange-900 mx-4 text-center';
      default:
        return 'bg-muted text-muted-foreground mr-8';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center">
        <div>
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please log in to access support chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-lg p-3 ${getMessageBubbleClass(message.sender_type)}`}>
                {/* Message Header */}
                <div className="flex items-center gap-2 mb-1">
                  {getMessageIcon(message.sender_type)}
                  <span className="text-xs font-medium">
                    {message.sender_type === 'user' ? 'You' : 
                     message.sender_type === 'ai' ? 'AI Assistant' :
                     message.sender_type === 'agent' ? 'Support Agent' : 'System'}
                  </span>
                  <span className="text-xs opacity-60">
                    {format(new Date(message.created_at), 'HH:mm')}
                  </span>
                  {message.ai_confidence_score && message.ai_confidence_score < 0.5 && (
                    <Badge variant="outline" className="text-xs">
                      Low Confidence
                    </Badge>
                  )}
                </div>
                
                {/* Message Content */}
                <div className="whitespace-pre-wrap text-sm">
                  {message.message_content}
                </div>

                {/* Escalation Indicator */}
                {message.is_escalation_trigger && (
                  <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
                    This message may require human assistance
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground rounded-lg p-3 mr-8">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span className="text-xs">AI Assistant is typing...</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Status Bar */}
      {conversation && (
        <div className="border-t border-border p-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>
                {conversation.conversation_type === 'ai' ? 'AI Assistant' :
                 conversation.conversation_type === 'escalated' ? 'Escalated to Human' :
                 'Human Support'}
              </span>
              {conversation.status === 'escalated' && (
                <Badge variant="secondary" className="text-xs">
                  Waiting for Agent
                </Badge>
              )}
            </div>
            
            {conversation.conversation_type === 'ai' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEscalateToHuman}
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
              >
                <Phone className="h-3 w-3 mr-1" />
                Talk to Human
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              conversation?.status === 'escalated' 
                ? "A support agent will respond shortly..."
                : "Type your message..."
            }
            disabled={isLoading || conversation?.status === 'escalated'}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading || conversation?.status === 'escalated'}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        {conversation?.conversation_type === 'ai' && messages.length <= 2 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {[
              "I need help with billing",
              "Technical issue",
              "How do I use this feature?",
              "Talk to human agent"
            ].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputValue(suggestion);
                  // Auto-send after a short delay
                  setTimeout(() => {
                    sendMessage(suggestion);
                    setInputValue('');
                  }, 100);
                }}
                className="text-xs h-6 px-2"
                disabled={isLoading}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};