import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ConciergeInputProps {
  onResponse: (response: string) => void;
  placeholder?: string;
  className?: string;
}

export function ConciergeInput({ onResponse, placeholder = "Ask me anything about growing your real estate business...", className = "" }: ConciergeInputProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('enhanced-ai-recommendations', {
        body: {
          message: `As a friendly real estate concierge, provide a helpful but brief response (2-3 sentences max): ${userInput}`,
          userId: user?.id || 'anonymous',
          context: {
            role: 'concierge',
            responseStyle: 'conversational_brief',
            topic: 'real estate advice',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      const response = data?.recommendation || "I'd be happy to help you with that! Could you provide more details about what you're looking for?";
      onResponse(response);

    } catch (error: any) {
      console.error('Error getting concierge response:', error);
      toast({
        title: "Connection Error",
        description: "I'm having trouble connecting right now. Please try again in a moment.",
        variant: "destructive",
      });
      onResponse("I'm having trouble connecting right now. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="flex-1 relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="min-h-[40px] max-h-[120px] resize-none pr-12"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-2 top-2 h-6 w-6 p-0"
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <Bot className="h-3 w-3 animate-pulse" />
          ) : (
            <Send className="h-3 w-3" />
          )}
        </Button>
      </div>
    </form>
  );
}