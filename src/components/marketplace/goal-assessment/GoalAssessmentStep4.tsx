import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { StepProps } from "./types";

export function GoalAssessmentStep4({ formData, onUpdate }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Time & Budget
        </CardTitle>
        <CardDescription>
          Help us recommend the right investment level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="time">Marketing Time Per Week</Label>
          <Input
            id="time"
            type="number"
            min="0"
            max="40"
            value={formData.marketing_time_per_week}
            onChange={(e) => onUpdate('marketing_time_per_week', parseInt(e.target.value) || 0)}
            placeholder="e.g., 5"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Hours per week you can dedicate to marketing
          </p>
        </div>
        
        <div>
          <Label htmlFor="budget">Budget Preference</Label>
          <Select 
            value={formData.budget_preference} 
            onValueChange={(value) => onUpdate('budget_preference', value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              <SelectItem value="low_cost">Low Cost - Under $500/month</SelectItem>
              <SelectItem value="balanced">Balanced - $500-2000/month</SelectItem>
              <SelectItem value="high_investment">High Investment - $2000+/month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}