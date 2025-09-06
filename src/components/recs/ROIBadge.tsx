import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { ROIEstimate, formatROI, formatAppointments } from "@/lib/roi";

interface ROIBadgeProps {
  roi?: ROIEstimate;
  text?: string;
  variant?: "default" | "compact";
}

export const ROIBadge = ({ roi, text, variant = "default" }: ROIBadgeProps) => {
  if (text) {
    return (
      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
        {text}
      </span>
    );
  }

  if (!roi) return null;

  if (variant === "compact") {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <TrendingUp className="h-3 w-3" />
        {formatROI(roi)}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        <span className="font-medium">{formatROI(roi)}</span>
      </div>
      <span>•</span>
      <span>{formatAppointments(roi.appointments_est)}</span>
    </div>
  );
};