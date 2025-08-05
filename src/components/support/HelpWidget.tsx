import { useState } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AISupportChat } from './AISupportChat';
import { useSupportChat } from '@/hooks/useSupportChat';

export const HelpWidget = () => {
  const { isOpen, unreadCount, openChat, closeChat } = useSupportChat();
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggle = () => {
    if (isOpen) {
      closeChat();
      setIsMinimized(false);
    } else {
      openChat();
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
    if (!isOpen) {
      openChat();
    }
  };

  return (
    <>
      {/* Floating Help Button */}
      {(!isOpen || isMinimized) && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={isMinimized ? handleRestore : handleToggle}
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="relative">
              <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
              {/* Pulse animation for attention */}
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            </div>
          </Button>
        </div>
      )}

      {/* Chat Interface */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Circle Support</h3>
                <p className="text-xs opacity-90">AI Assistant & Human Support</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMinimize}
                className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggle}
                className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="h-full">
            <AISupportChat />
          </div>
        </div>
      )}
    </>
  );
};