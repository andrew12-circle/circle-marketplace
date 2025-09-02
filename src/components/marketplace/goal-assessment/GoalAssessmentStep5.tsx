import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { StepProps } from "./types";

export function GoalAssessmentStep5({ formData, onUpdate }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Work Style & Personality
        </CardTitle>
        <CardDescription>
          Help us understand how you prefer to work
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="personality">Personality Type</Label>
          <Select 
            value={formData.personality_type} 
            onValueChange={(value) => onUpdate('personality_type', value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select your personality type" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50 pointer-events-auto">
              <SelectItem value="extrovert">Extrovert - I energize from interaction</SelectItem>
              <SelectItem value="introvert">Introvert - I prefer focused, one-on-one work</SelectItem>
              <SelectItem value="ambivert">Ambivert - I'm comfortable with both</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="work_style">Work Style</Label>
          <Select 
            value={formData.work_style} 
            onValueChange={(value) => onUpdate('work_style', value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select your work style" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50 pointer-events-auto">
              <SelectItem value="hunter">Hunter - I love prospecting and cold outreach</SelectItem>
              <SelectItem value="farmer">Farmer - I prefer nurturing existing relationships</SelectItem>
              <SelectItem value="hybrid">Hybrid - I do both equally well</SelectItem>
              <SelectItem value="referral_focused">Referral Focused - I work primarily through referrals</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="communication">Communication Preference</Label>
          <Select 
            value={formData.communication_preference} 
            onValueChange={(value) => onUpdate('communication_preference', value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="How do you prefer to communicate?" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50 pointer-events-auto">
              <SelectItem value="phone_calls">Phone Calls</SelectItem>
              <SelectItem value="video_calls">Video Calls</SelectItem>
              <SelectItem value="text_email">Text & Email</SelectItem>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="in_person">In Person</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}