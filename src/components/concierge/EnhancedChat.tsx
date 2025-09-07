import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  Send,
  Paperclip,
  X,
  Image as ImageIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
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

  const typeOutReply = (fullText: string, speedMs = 18) => {
    return new Promise<void>((resolve) => {
      setMessages((prev) => [...prev, { 
        id: Date.now().toString(),
        role: "assistant", 
        content: "",
        timestamp: new Date()
      }]);
      
      let i = 0;
      const id = setInterval(() => {
        i += 1;
        setMessages((prev) => {
          const arr = [...prev];
          if (arr.length > 0) {
            arr[arr.length - 1].content = fullText.substring(0, i);
          }
          return arr;
        });
        
        if (i >= fullText.length) {
          clearInterval(id);
          resolve();
        }
      }, speedMs);
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() && uploadedFiles.length === 0) return;

    setIsLoading(true);

    // Prepare images
    const images: string[] = [];
    for (const file of uploadedFiles) {
      if (file.type.startsWith('image/')) {
        const base64 = await convertFileToBase64(file);
        images.push(base64);
      }
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      images: images.length > 0 ? images : undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Enhanced prompt for ChatGPT-like behavior
      const enhancedPrompt = `You are an intelligent AI assistant for Circle Marketplace, a real estate business platform. You can:

1. **Analyze images** - If user uploads property photos, listing images, marketing materials, etc., provide detailed analysis
2. **Access marketplace data** - Recommend services, tools, and vendors from our extensive real estate marketplace
3. **Business strategy** - Provide comprehensive real estate business advice like ChatGPT
4. **Data-driven insights** - Pull from our database of successful agent patterns and market trends

**Context**: Circle has 500+ vetted real estate services including CRMs, lead generation, marketing tools, coaching, transaction management, and more.

**User Query**: ${text}
${images.length > 0 ? `**Images attached**: ${images.length} image(s) for analysis` : ''}

Provide a comprehensive, helpful response. If images are provided, analyze them thoroughly. Always suggest relevant marketplace solutions when appropriate.`;

      const { data, error } = await supabase.functions.invoke('ai-concierge-chat', {
        body: {
          action: 'chat',
          userQuery: text,
          images: images.length > 0 ? images : undefined,
          context: {
            hasImages: images.length > 0,
            fileCount: uploadedFiles.length,
            marketplace: true,
            comprehensive: true,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      const aiResponse = data?.messages?.find(m => m.role === 'assistant')?.content || "I'd be happy to help you with that! Could you provide more details about what you're looking for?";
      await typeOutReply(aiResponse, 15);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
      
      await typeOutReply("I apologize, but I'm having trouble processing your request right now. Please try again in a moment.", 20);
    } finally {
      setIsLoading(false);
      setUploadedFiles([]);
      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const message = (e.target as HTMLTextAreaElement).value.trim();
      if (message || uploadedFiles.length > 0) {
        sendMessage(message);
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[90vw] sm:w-[540px] flex flex-col h-full">
        <SheetHeader className="pt-4 px-4">
          <SheetTitle className="text-base text-center flex items-center justify-center gap-2">
            <Brain className="h-5 w-5 text-sky-600" />
            Circle AI Assistant
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 mt-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">
                I'm your AI assistant! I can analyze images, answer questions about real estate, 
                and recommend tools from our marketplace.
              </p>
              <p className="text-xs mt-2">
                Upload images, ask questions, or request business advice.
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  message.role === 'user' 
                    ? 'bg-sky-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.images && message.images.length > 0 && (
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      {message.images.map((image, index) => (
                        <img 
                          key={index}
                          src={image} 
                          alt="Uploaded" 
                          className="rounded-lg max-h-32 w-full object-cover"
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="px-4 pb-4 pt-2">
          <div className="w-full space-y-3">
            {/* File upload area */}
            <div className="flex items-center gap-2 min-h-[20px]">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                multiple
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-2"
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              {uploadedFiles.length > 0 && (
                <div className="flex gap-1 flex-wrap flex-1">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-1 bg-sky-100 text-sky-800 px-2 py-1 rounded-md text-xs">
                      {file.type.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : '📄'}
                      <span className="max-w-[100px] truncate">{file.name}</span>
                      <button 
                        onClick={() => removeFile(index)} 
                        className="text-sky-600 hover:text-sky-800 ml-1"
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Message input */}
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                placeholder="Ask me anything about real estate, upload images to analyze, or get marketplace insights..."
                className="min-h-[44px] max-h-32 resize-none"
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                defaultValue={initialMessage || ""}
              />
              <Button
                onClick={() => {
                  const message = inputRef.current?.value.trim() || "";
                  if (message || uploadedFiles.length > 0) {
                    sendMessage(message);
                  }
                }}
                disabled={isLoading}
                className="h-11 px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}