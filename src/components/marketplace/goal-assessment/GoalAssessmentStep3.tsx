import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { StepProps } from "./types";

export function GoalAssessmentStep3({ formData, onUpdate }: StepProps) {
  console.log('Step3 formData:', formData);
  console.log('primary_challenge value:', formData.primary_challenge);
  
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
            onValueChange={(value) => {
              console.log('Primary challenge selected:', value);
              onUpdate('primary_challenge', value);
            }}
            >
              <SelectTrigger className="w-full bg-background border">
                <SelectValue placeholder="Select your biggest challenge" />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-lg z-[100] max-h-[300px] overflow-y-auto">
                <SelectItem value="lead_generation" className="cursor-pointer">Lead Generation</SelectItem>
                <SelectItem value="branding" className="cursor-pointer">Personal Branding</SelectItem>
                <SelectItem value="systems" className="cursor-pointer">Business Systems</SelectItem>
                <SelectItem value="conversion" className="cursor-pointer">Lead Conversion</SelectItem>
                <SelectItem value="follow_up" className="cursor-pointer">Follow-up & Nurturing</SelectItem>
                <SelectItem value="pricing" className="cursor-pointer">Pricing Strategy</SelectItem>
                <SelectItem value="market_knowledge" className="cursor-pointer">Market Knowledge</SelectItem>
              </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}