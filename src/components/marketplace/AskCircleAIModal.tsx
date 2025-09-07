import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ConciergeChat } from "@/components/concierge/ConciergeChat";
import { useState } from "react";

interface AskCircleAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessage?: string;
}

export function AskCircleAIModal({ open, onOpenChange, initialMessage }: AskCircleAIModalProps) {
  const [threadId, setThreadId] = useState<string>();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] p-0">
        <VisuallyHidden>
          <DialogTitle>Circle Agent Concierge</DialogTitle>
        </VisuallyHidden>
        <ConciergeChat
          threadId={threadId} 
          onThreadChange={setThreadId}
          initialMessage={initialMessage}
        />
      </DialogContent>
    </Dialog>
  );
}