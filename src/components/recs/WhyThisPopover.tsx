import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export function WhyThisPopover({
  peerUsage,
  expectedDelta,
  fitReason,
}: { 
  peerUsage?: string; 
  expectedDelta?: string; 
  fitReason?: string; 
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Why this">
          <Info className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm">
        <p className="font-medium mb-1">Why you're seeing this</p>
        {fitReason && <p className="mb-1">• {fitReason}</p>}
        {peerUsage && <p className="mb-1">• {peerUsage}</p>}
        {expectedDelta && <p className="mb-1">• Expected impact: {expectedDelta}</p>}
      </PopoverContent>
    </Popover>
  );
}