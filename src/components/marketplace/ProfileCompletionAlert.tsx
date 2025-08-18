
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ProfileCompletionAlertProps {
  missingItems: string[];
  onComplete: () => void;
}

export function ProfileCompletionAlert({ missingItems, onComplete }: ProfileCompletionAlertProps) {
  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/20 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-orange-800 dark:text-orange-200">
              Complete Your Profile for Personalized Recommendations
            </h3>
            <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
              Missing: {missingItems.join(', ')}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={onComplete}
            >
              Complete Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
