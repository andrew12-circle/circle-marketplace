import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Send, Paperclip, X, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  timestamp: Date;
}

interface EnhancedChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

export default function EnhancedChat({ isOpen, onClose, initialMessage }: EnhancedChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chat opens
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm your enhanced AI assistant. I can analyze images, answer questions about real estate, and help you find the perfect tools for your business. What can I help you with today?`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialMessage && isOpen) {
      setInput(initialMessage);
    }
  }, [initialMessage, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Only images supported",
        description: "Please select only image files (PNG, JPG, GIF, etc.)",
        variant: "destructive",
      });
    }
    
    setUploadedFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const typeOutReply = async (text: string, speed = 20) => {
    const messageIndex = messages.length;
    
    // Add empty assistant message
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }]);

    // Type out character by character
    for (let i = 0; i <= text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, speed));
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[messageIndex]) {
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            content: text.slice(0, i)
          };
        }
        return newMessages;
      });
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && uploadedFiles.length === 0) return;
    if (isLoading) return;

    setIsLoading(true);
    
    try {
      // Convert files to base64 for image analysis
      const images = await Promise.all(
        uploadedFiles.map(file => convertFileToBase64(file))
      );

      // Add user message
      setMessages(prev => [...prev, {
        role: 'user',
        content: text || 'Please analyze this image',
        images: images.length > 0 ? images : undefined,
        timestamp: new Date()
      }]);

      // Clear input and files
      setInput('');
      setUploadedFiles([]);

      let aiResponse;
      
      if (images.length > 0) {
        // Use vision-capable AI for image analysis
        const { data, error } = await supabase.functions.invoke('ai-vision-concierge', {
          body: {
            images: images,
            prompt: text || 'Please analyze this image and provide real estate advice',
            userId: user?.id || 'anonymous'
          }
        });

        if (error) throw error;
        aiResponse = data?.analysis || "I can see the image you shared. Could you tell me more about what specific advice you're looking for?";
      } else {
        // Use simple OpenAI chat
        const { data, error } = await supabase.functions.invoke('simple-openai-chat', {
          body: {
            message: text,
            context: {
              messageCount: messages.length,
              timestamp: new Date().toISOString()
            }
          }
        });

        if (error) throw error;
        aiResponse = data?.message || "I'd be happy to help you with that! Could you provide more details about what you're looking for?";
      }
      
      await typeOutReply(aiResponse, 15);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Enhanced AI Assistant
            </SheetTitle>
            <SheetDescription>
              Chat with AI assistant for real estate advice and image analysis
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <p>Start a conversation with your AI assistant</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-muted'
                      }`}
                    >
                      {message.images && (
                        <div className="mb-2 grid grid-cols-2 gap-2">
                          {message.images.map((image, imgIndex) => (
                            <img
                              key={imgIndex}
                              src={image}
                              alt="Uploaded"
                              className="rounded max-h-32 object-cover"
                            />
                          ))}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t">
            {/* File upload preview */}
            {uploadedFiles.length > 0 && (
              <div className="mb-3 flex gap-2 flex-wrap">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center gap-2 bg-muted rounded-lg p-2 pr-8">
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-sm truncate max-w-[100px]">{file.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-6 w-6 p-0 rounded-full bg-background shadow-sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Input area */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything or upload an image..."
                  className="min-h-[60px] max-h-[120px] resize-none pr-12"
                  disabled={isLoading}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute bottom-2 right-2 h-8 w-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                onClick={sendMessage}
                disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading}
                className="h-[60px] px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </>
  );
}