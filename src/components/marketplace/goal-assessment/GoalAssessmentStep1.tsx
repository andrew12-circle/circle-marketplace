import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { StepProps } from "./types";

export function GoalAssessmentStep1({ formData, onUpdate }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Annual Goals
        </CardTitle>
        <CardDescription>
          Tell us about your business targets for this year
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="transactions">Annual Transaction Goal</Label>
          <Input
            id="transactions"
            type="number"
            min="1"
            value={formData.annual_goal_transactions}
            onChange={(e) => onUpdate('annual_goal_transactions', parseInt(e.target.value) || 0)}
            placeholder="e.g., 12"
          />
          <p className="text-sm text-muted-foreground mt-1">
            How many transactions do you want to close this year?
          </p>
        </div>
        
        <div>
          <Label htmlFor="volume">Annual Volume Goal</Label>
          <Input
            id="volume"
            type="number"
            min="0"
            value={formData.annual_goal_volume}
            onChange={(e) => onUpdate('annual_goal_volume', parseInt(e.target.value) || 0)}
            placeholder="e.g., 3000000"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Total dollar volume you want to achieve ($)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}