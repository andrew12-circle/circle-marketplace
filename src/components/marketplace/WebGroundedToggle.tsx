import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Globe, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

interface WebGroundedToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function WebGroundedToggle({ enabled, onToggle, className }: WebGroundedToggleProps) {
  return (
    <Card className={`p-4 border-border/50 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {enabled ? (
              <Globe className="h-4 w-4 text-primary" />
            ) : (
              <Zap className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor="web-grounded" className="font-medium">
              {enabled ? "Market Intelligence Mode" : "AI-Only Mode"}
            </Label>
          </div>
          <Switch
            id="web-grounded"
            checked={enabled}
            onCheckedChange={onToggle}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        {enabled 
          ? "Plans include current market data and industry trends from curated real estate sources"
          : "Plans generated using AI analysis of your profile and performance data only"
        }
      </p>
    </Card>
  );
}