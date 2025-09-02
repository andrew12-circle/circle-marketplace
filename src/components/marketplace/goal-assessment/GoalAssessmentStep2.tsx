import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { StepProps } from "./types";

export function GoalAssessmentStep2({ formData, onUpdate }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Commission Structure
        </CardTitle>
        <CardDescription>
          Help us understand your earning potential
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="commission">Average Commission Per Deal</Label>
          <Input
            id="commission"
            type="number"
            min="0"
            value={formData.average_commission_per_deal}
            onChange={(e) => onUpdate('average_commission_per_deal', parseInt(e.target.value) || 0)}
            placeholder="e.g., 5000"
          />
          <p className="text-sm text-muted-foreground mt-1">
            What's your typical commission per transaction? ($)
          </p>
        </div>
        
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Projected Annual Income</h4>
          <p className="text-2xl font-bold text-primary">
            ${(formData.annual_goal_transactions * formData.average_commission_per_deal).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Based on {formData.annual_goal_transactions} transactions × ${formData.average_commission_per_deal.toLocaleString()} avg commission
          </p>
        </div>
      </CardContent>
    </Card>
  );
}