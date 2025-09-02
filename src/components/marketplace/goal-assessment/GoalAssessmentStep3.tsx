import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { StepProps } from "./types";

export function GoalAssessmentStep3({ formData, onUpdate }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Biggest Challenge
        </CardTitle>
        <CardDescription>
          What's your main obstacle to reaching your goals?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="challenge">Primary Challenge</Label>
          <Select 
            value={formData.primary_challenge} 
            onValueChange={(value) => onUpdate('primary_challenge', value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select your biggest challenge" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50 pointer-events-auto">
              <SelectItem value="lead_generation">Lead Generation</SelectItem>
              <SelectItem value="branding">Personal Branding</SelectItem>
              <SelectItem value="systems">Business Systems</SelectItem>
              <SelectItem value="conversion">Lead Conversion</SelectItem>
              <SelectItem value="follow_up">Follow-up & Nurturing</SelectItem>
              <SelectItem value="pricing">Pricing Strategy</SelectItem>
              <SelectItem value="market_knowledge">Market Knowledge</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}