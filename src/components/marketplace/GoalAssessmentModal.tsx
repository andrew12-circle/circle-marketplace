import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Target, TrendingUp, Clock, DollarSign } from "lucide-react";

interface GoalAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

interface GoalFormData {
  annual_goal_transactions: number;
  annual_goal_volume: number;
  average_commission_per_deal: number;
  primary_challenge: string;
  marketing_time_per_week: number;
  budget_preference: string;
}

export function GoalAssessmentModal({ open, onOpenChange, onComplete }: GoalAssessmentModalProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<GoalFormData>({
    annual_goal_transactions: 12,
    annual_goal_volume: 3000000,
    average_commission_per_deal: 5000,
    primary_challenge: '',
    marketing_time_per_week: 5,
    budget_preference: 'balanced'
  });

  // Prefill from existing profile when opening (for editing goals)
  useEffect(() => {
    if (open && profile) {
      setFormData({
        annual_goal_transactions: (profile as any).annual_goal_transactions ?? 12,
        annual_goal_volume: (profile as any).annual_goal_volume ?? 3000000,
        average_commission_per_deal: (profile as any).average_commission_per_deal ?? 5000,
        primary_challenge: (profile as any).primary_challenge ?? '',
        marketing_time_per_week: (profile as any).marketing_time_per_week ?? 5,
        budget_preference: (profile as any).budget_preference ?? 'balanced',
      });
      setCurrentStep(1);
    }
  }, [open, profile]);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof GoalFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          onboarding_completed: true,
          last_assessment_date: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Goals Set Successfully!",
        description: "We'll now personalize your marketplace recommendations based on your goals.",
      });

      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving goals:', error);
      toast({
        title: "Error",
        description: "Failed to save your goals. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
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
                  onChange={(e) => handleInputChange('annual_goal_transactions', parseInt(e.target.value) || 0)}
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
                  onChange={(e) => handleInputChange('annual_goal_volume', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 3000000"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Total dollar volume you want to achieve ($)
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
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
                  onChange={(e) => handleInputChange('average_commission_per_deal', parseInt(e.target.value) || 0)}
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

      case 3:
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
                  onValueChange={(value) => handleInputChange('primary_challenge', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your biggest challenge" />
                  </SelectTrigger>
                  <SelectContent>
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

      case 4:
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
                  onChange={(e) => handleInputChange('marketing_time_per_week', parseInt(e.target.value) || 0)}
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
                  onValueChange={(value) => handleInputChange('budget_preference', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low_cost">Low Cost - Under $500/month</SelectItem>
                    <SelectItem value="balanced">Balanced - $500-2000/month</SelectItem>
                    <SelectItem value="high_investment">High Investment - $2000+/month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Let's Set Your Goals</DialogTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {renderStep()}
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep === totalSteps ? (
              <Button 
                onClick={handleComplete}
                disabled={isLoading || !formData.primary_challenge}
              >
                {isLoading ? "Saving..." : "Complete Setup"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && (!formData.annual_goal_transactions || !formData.annual_goal_volume)) ||
                  (currentStep === 2 && !formData.average_commission_per_deal) ||
                  (currentStep === 3 && !formData.primary_challenge) ||
                  (currentStep === 4 && !formData.marketing_time_per_week)
                }
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}