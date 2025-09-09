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
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasProcessedInitialContent, setHasProcessedInitialContent] = useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('🚀 AskCircleAIModal state:', { open, isMinimized, expandToken, hasInitialMessage: !!initialMessage });
  }, [open, isMinimized, expandToken, initialMessage]);

  // Process initial content only once and allow minimizing after
  React.useEffect(() => {
    if (open && (initialMessage || expandToken)) {
      console.log('🔥 Processing initial content - ensuring expanded');
      setIsMinimized(false);
      setHasProcessedInitialContent(true);
    }
  }, [open, initialMessage, expandToken]);

  // Reset states when modal opens
  React.useEffect(() => {
    if (open) {
      console.log('🔄 Modal opened, resetting states');
      setIsMinimized(false);
      // Don't automatically mark as processed - let it start expanded
      if (!initialMessage && !expandToken) {
        // Only allow minimizing if there's no initial content to process
        setHasProcessedInitialContent(true);
      }
    } else {
      // Reset processed flag when modal closes
      setHasProcessedInitialContent(false);
    }
  }, [open]);

  const handleMinimize = () => {
    console.log('📉 Minimize button clicked');
    setIsMinimized(true);
  };

  const handleRestore = () => {
    console.log('📈 Restore button clicked');
    setIsMinimized(false);
  };

  const handleClose = () => {
    console.log('❌ Close button clicked');
    setIsMinimized(false);
    onOpenChange(false);
  };

  if (!open) return null;

  // Show minimized state if user clicked minimize and modal has been processed
  const shouldShowMinimized = isMinimized;
  
  console.log('🎭 Render decision:', { 
    isMinimized, 
    hasInitialMessage: !!initialMessage, 
    hasExpandToken: !!expandToken, 
    shouldShowMinimized 
  });

  // Minimized state - floating widget (only if no initial content)
  if (shouldShowMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={handleRestore}
          className="h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white animate-pulse -translate-y-[10px]"
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
      <DialogContent className="max-w-6xl h-[85vh] p-0 flex flex-col">
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
        
        <div className="flex-1 min-h-0">
          <ConciergeChat
            threadId={threadId} 
            onThreadChange={setThreadId}
            initialMessage={initialMessage}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}