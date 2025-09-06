import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle, TrendingUp, Users, Target } from "lucide-react";

interface WhyThisPopoverProps {
  reasons: {
    peer_usage: string;
    expected_delta: string;
    fit_reason: string;
  };
  serviceName: string;
}

export const WhyThisPopover = ({ reasons, serviceName }: WhyThisPopoverProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="top" align="center">
        <div className="space-y-3">
          <div className="font-medium text-sm">Why {serviceName}?</div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                  Peer Usage
                </div>
                <div className="text-sm">{reasons.peer_usage}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                  Expected Impact
                </div>
                <div className="text-sm">{reasons.expected_delta}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                  Why It Fits
                </div>
                <div className="text-sm">{reasons.fit_reason}</div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-primary"
              onClick={() => setOpen(false)}
            >
              Learn more about this recommendation →
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};