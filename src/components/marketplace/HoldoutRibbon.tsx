import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface HoldoutRibbonProps {
  isVisible: boolean;
}

export const HoldoutRibbon = ({ isVisible }: HoldoutRibbonProps) => {
  if (!isVisible) return null;

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800">
      <Info className="h-4 w-4" />
      <AlertDescription className="text-sm">
        You're in holdout group - viewing services by newest instead of ranking. 
        Add <code className="px-1 py-0.5 bg-orange-100 rounded text-xs">?ab=ranked</code> to URL for ranked view.
      </AlertDescription>
    </Alert>
  );
};