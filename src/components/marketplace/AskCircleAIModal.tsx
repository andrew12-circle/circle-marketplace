import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConciergeChat } from "@/components/concierge/ConciergeChat";
import { useState } from "react";

interface AskCircleAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AskCircleAIModal({ open, onOpenChange }: AskCircleAIModalProps) {
  const [threadId, setThreadId] = useState<string>();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] p-0">
        <ConciergeChat threadId={threadId} onThreadChange={setThreadId} />
      </DialogContent>
    </Dialog>
  );
}