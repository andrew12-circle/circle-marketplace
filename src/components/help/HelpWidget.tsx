import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, X, MessageCircle, Phone, Mic, MicOff } from 'lucide-react';
import { HelpAnswers } from './HelpAnswers';
import { HelpAI } from './HelpAI';
import { HelpGuides } from './HelpGuides';
import { HelpContact } from './HelpContact';
import { useLocation } from 'react-router-dom';

interface HelpWidgetProps {
  onClose?: () => void;
}

export const HelpWidget: React.FC<HelpWidgetProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('answers');
  const [showProactivePrompt, setShowProactivePrompt] = useState(false);
  const location = useLocation();

  // Proactive help detection
  useEffect(() => {
    const timer = setTimeout(() => {
      // Show proactive help after 30 seconds of inactivity on complex pages
      const complexPages = ['/vendor-dashboard', '/admin', '/command-center'];
      if (complexPages.some(page => location.pathname.startsWith(page))) {
        setShowProactivePrompt(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleOpen = (tab?: string) => {
    setIsOpen(true);
    if (tab) setActiveTab(tab);
    setShowProactivePrompt(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
    setShowProactivePrompt(false);
  };

  return (
    <>
      {/* Proactive Help Prompt */}
      {showProactivePrompt && !isOpen && (
        <div className="fixed bottom-20 right-6 z-50 animate-in slide-in-from-bottom-4">
          <Card className="p-3 shadow-lg border border-primary/20 bg-card">
            <div className="flex items-center gap-2 text-sm">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span>Need help getting started?</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleOpen()}
                className="h-auto p-1 text-primary hover:text-primary/80"
              >
                Yes
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowProactivePrompt(false)}
                className="h-auto p-1"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Help Widget */}
      {isOpen ? (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-96 animate-in slide-in-from-bottom-4">
          <Card className="h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Help Center</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-auto p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <CardContent className="flex-1 p-0 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4 m-2">
                  <TabsTrigger value="answers" className="text-xs">Answers</TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs">Ask AI</TabsTrigger>
                  <TabsTrigger value="guides" className="text-xs">Guides</TabsTrigger>
                  <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="answers" className="h-full m-0">
                    <HelpAnswers currentRoute={location.pathname} />
                  </TabsContent>
                  
                  <TabsContent value="ai" className="h-full m-0">
                    <HelpAI />
                  </TabsContent>
                  
                  <TabsContent value="guides" className="h-full m-0">
                    <HelpGuides currentRoute={location.pathname} />
                  </TabsContent>
                  
                  <TabsContent value="contact" className="h-full m-0">
                    <HelpContact currentRoute={location.pathname} />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Button
          onClick={() => handleOpen()}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
          size="icon"
        >
          <HelpCircle className="w-6 h-6" />
        </Button>
      )}
    </>
  );
};