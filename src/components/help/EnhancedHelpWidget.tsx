import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, X, MessageCircle, Send, Search, BookOpen, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedAI } from '@/hooks/useEnhancedAI';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { HelpAnswers } from './HelpAnswers';
import { HelpGuides } from './HelpGuides';
import { GuideTour } from './GuideTour';
import { guides, Guide } from './guides';

export const EnhancedHelpWidget: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('guides');
  const [activeTour, setActiveTour] = useState<Guide | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    email: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { getQuickInsight, isLoading } = useEnhancedAI();

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    
    const message = chatInput;
    setChatInput('');
    
    try {
      await getQuickInsight(message);
      toast({
        title: "AI Response",
        description: "Check the AI Dashboard for detailed insights!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'support_request',
          data: {
            subject: contactForm.subject,
            message: contactForm.message,
            userEmail: contactForm.email || user?.email,
            currentPage: window.location.pathname,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "We'll respond within 24 hours.",
      });

      setContactForm({ subject: '', message: '', email: '' });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartTour = (guide: Guide) => {
    setActiveTour(guide);
    setIsOpen(false);
  };

  const handleEndTour = () => {
    setActiveTour(null);
  };

  return (
    <>
      {/* Help Button */}
      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg cursor-pointer flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ 
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#3b82f6'
          }}
        >
          <HelpCircle className="w-7 h-7 text-white" />
        </div>
      )}

      {/* Enhanced Help Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-96 animate-in slide-in-from-bottom-4">
          <Card className="h-full flex flex-col shadow-2xl border-blue-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm">Help Center</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4 mx-3 mb-2">
                  <TabsTrigger value="guides" className="text-xs">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Tours
                  </TabsTrigger>
                  <TabsTrigger value="faq" className="text-xs">FAQ</TabsTrigger>
                  <TabsTrigger value="chat" className="text-xs">AI Chat</TabsTrigger>
                  <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="guides" className="h-full m-0">
                    <HelpGuides 
                      currentRoute={location.pathname}
                      onStartTour={handleStartTour}
                    />
                  </TabsContent>

                  <TabsContent value="faq" className="h-full m-0">
                    <HelpAnswers currentRoute={location.pathname} />
                  </TabsContent>
                  
                  <TabsContent value="chat" className="h-full m-0">
                    <div className="h-full flex flex-col">
                      <div className="flex-1 p-3">
                        <div className="text-center text-sm text-muted-foreground">
                          Ask me anything about the platform!
                        </div>
                      </div>
                      <div className="p-3 border-t">
                        <div className="flex gap-2">
                          <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type your question..."
                            className="flex-1 h-8 text-xs"
                            onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                          />
                          <Button
                            onClick={handleChatSend}
                            disabled={!chatInput.trim() || isLoading}
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="contact" className="h-full m-0">
                    <form onSubmit={handleContactSubmit} className="h-full flex flex-col">
                      <ScrollArea className="flex-1 p-3">
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="subject" className="text-xs">Subject</Label>
                            <Input
                              id="subject"
                              value={contactForm.subject}
                              onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                              className="h-8 text-xs"
                              placeholder="Brief description"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="email" className="text-xs">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={contactForm.email}
                              onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                              className="h-8 text-xs"
                              placeholder={user?.email || "your@email.com"}
                            />
                          </div>
                          <div>
                            <Label htmlFor="message" className="text-xs">Message</Label>
                            <Textarea
                              id="message"
                              value={contactForm.message}
                              onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                              placeholder="Describe your issue..."
                              className="min-h-[60px] text-xs resize-none"
                              required
                            />
                          </div>
                        </div>
                      </ScrollArea>
                      <div className="p-3 border-t">
                        <Button type="submit" className="w-full h-8 text-xs">
                          Send Message
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Tour */}
      {activeTour && (
        <GuideTour
          guide={activeTour}
          onComplete={handleEndTour}
          onSkip={handleEndTour}
        />
      )}
    </>
  );
};