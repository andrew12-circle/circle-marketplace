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
}

export function AskCircleAIModal({ open, onOpenChange, initialMessage }: AskCircleAIModalProps) {
  const [threadId, setThreadId] = useState<string>();
  const [isMinimized, setIsMinimized] = useState(false);

  // Reset minimized state when modal opens - ensure it always starts unminimized
  React.useEffect(() => {
    if (open) {
      setIsMinimized(false);
    } else {
      // Reset when closed to ensure clean state
      setIsMinimized(false);
    }
  }, [open]);

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