import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';
import { useEnhancedAI } from '@/hooks/useEnhancedAI';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export const HelpAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm here to help you with any questions about the platform. What can I assist you with today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { getQuickInsight, isLoading } = useEnhancedAI({
    onSuccess: (response) => {
      if (response) {
        addMessage('ai', response);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    }
  });

  const {
    isListening,
    isProcessing,
    startListening,
    stopListening,
    isSupported: voiceSupported
  } = useVoiceAssistant({
    onTranscript: (transcript) => {
      if (transcript.trim()) {
        setInputValue(transcript);
      }
    },
    onResponse: (response) => {
      if (response) {
        addMessage('ai', response);
      }
    }
  });

  const addMessage = (type: 'user' | 'ai', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);

  // Use new concierge answers function
  try {
    const { data, error } = await supabase.functions.invoke('concierge-answers', {
      body: { query: userMessage }
    });

    if (error) throw error;
    
    if (data?.response) {
      addMessage('ai', data.response);
    } else {
      throw new Error('No response received');
    }
  } catch (error) {
    console.error('Concierge error:', error);
    // Fallback to original AI function
    await getQuickInsight(userMessage);
  }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      stopListening();
    } else {
      try {
        await startListening();
      } catch (error) {
        toast({
          title: "Voice Error",
          description: "Could not access microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 h-9"
            disabled={isLoading}
          />
          {voiceSupported && (
            <Button
              variant={isListening ? "destructive" : "outline"}
              size="sm"
              onClick={handleVoiceToggle}
              disabled={isProcessing}
              className="h-9 w-9 p-0"
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          )}
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="h-9 w-9 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {isListening && (
          <p className="text-xs text-primary mt-1 text-center animate-pulse">
            Listening... Speak now
          </p>
        )}
      </div>
    </div>
  );
};