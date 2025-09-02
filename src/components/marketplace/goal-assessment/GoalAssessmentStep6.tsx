import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { StepProps } from "./types";

export function GoalAssessmentStep6({ formData, onUpdate }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Current Tools & Systems
        </CardTitle>
        <CardDescription>
          Tell us what tools you're already using
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="crm">Current CRM</Label>
          <Select 
            value={formData.current_crm} 
            onValueChange={(value) => onUpdate('current_crm', value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select your CRM" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              <SelectItem value="none">No CRM</SelectItem>
              <SelectItem value="chime">Chime</SelectItem>
              <SelectItem value="top_producer">Top Producer</SelectItem>
              <SelectItem value="wise_agent">Wise Agent</SelectItem>
              <SelectItem value="follow_up_boss">Follow Up Boss</SelectItem>
              <SelectItem value="kvcore">KVCore</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="dialer">Current Dialer/Phone System</Label>
          <Select 
            value={formData.current_dialer} 
            onValueChange={(value) => onUpdate('current_dialer', value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select your dialer" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              <SelectItem value="none">No Dialer</SelectItem>
              <SelectItem value="mojo">Mojo</SelectItem>
              <SelectItem value="redx">RedX</SelectItem>
              <SelectItem value="vulcan7">Vulcan7</SelectItem>
              <SelectItem value="phoneburner">PhoneBurner</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="social_media">Social Media Usage</Label>
          <Select 
            value={formData.social_media_usage} 
            onValueChange={(value) => onUpdate('social_media_usage', value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="How do you use social media?" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              <SelectItem value="heavy_user">Heavy User - Daily posting and engagement</SelectItem>
              <SelectItem value="moderate_user">Moderate User - Regular posting</SelectItem>
              <SelectItem value="light_user">Light User - Occasional posts</SelectItem>
              <SelectItem value="minimal_user">Minimal User - Rarely post</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}