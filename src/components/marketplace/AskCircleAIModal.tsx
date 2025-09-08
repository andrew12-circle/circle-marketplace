import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ConciergeChat } from "@/components/concierge/ConciergeChat";
import { Button } from "@/components/ui/button";
import { Minus, MessageSquare } from "lucide-react";

interface AskCircleAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessage?: string;
  expandToken?: number;
}

export function AskCircleAIModal({ open, onOpenChange, initialMessage, expandToken }: AskCircleAIModalProps) {
  const [threadId, setThreadId] = useState<string>();
  // Always start expanded, never minimized for new conversations
  const [isMinimized, setIsMinimizedState] = useState(false);
  
  // Wrapper to debug when isMinimized gets set
  const setIsMinimized = (value: boolean) => {
    console.log('🎛️ setIsMinimized called with:', value, 'Stack:', new Error().stack?.split('\n')[2]);
    setIsMinimizedState(value);
  };

  // Debug logging
  React.useEffect(() => {
    console.log('🚀 AskCircleAIModal state:', { open, isMinimized, expandToken, hasInitialMessage: !!initialMessage });
  }, [open, isMinimized, expandToken, initialMessage]);

  // CRITICAL: Force expanded state when opening with content
  React.useEffect(() => {
    if (open && (initialMessage || expandToken)) {
      console.log('🔥 FORCING EXPANDED STATE - modal opened with content');
      setIsMinimized(false);
    }
  }, [open, initialMessage, expandToken]);

  // Reset minimized state when modal opens
  React.useEffect(() => {
    if (open) {
      console.log('🔄 Modal opened, resetting minimized state');
      setIsMinimized(false);
    }
  }, [open]);

  // Reset minimized state when expandToken changes (new conversation trigger)
  React.useEffect(() => {
    if (expandToken) {
      console.log('🎯 ExpandToken changed, ensuring modal is expanded:', expandToken);
      setIsMinimized(false);
    }
  }, [expandToken]);

  // Reset minimized state when initialMessage changes
  React.useEffect(() => {
    if (open && initialMessage) {
      console.log('📝 InitialMessage provided, ensuring modal is expanded');
      setIsMinimized(false);
    }
  }, [initialMessage, open]);

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsMinimized(false);
    onOpenChange(false);
  };

  if (!open) return null;

  // Minimized state - floating widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={handleRestore}
          className="h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white animate-pulse"
          size="sm"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  // Full modal state
  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[85vh] p-0">
        <VisuallyHidden>
          <DialogTitle>Circle Agent Concierge</DialogTitle>
        </VisuallyHidden>
        
        {/* Add minimize button to the chat header */}
        <div className="absolute top-4 right-16 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMinimize}
            className="h-8 w-8 p-0"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>
        
        <ConciergeChat
          threadId={threadId} 
          onThreadChange={setThreadId}
          initialMessage={initialMessage}
        />
      </DialogContent>
    </Dialog>
  );
}