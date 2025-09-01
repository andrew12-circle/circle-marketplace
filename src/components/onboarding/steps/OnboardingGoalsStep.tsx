import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Target, Sparkles } from 'lucide-react';

interface OnboardingGoalsStepProps {
  onNext: () => void;
}

export function OnboardingGoalsStep({ onNext }: OnboardingGoalsStepProps) {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    primary_challenge: (profile as any)?.primary_challenge || '',
    budget_preference: (profile as any)?.budget_preference || 'balanced'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    console.log('OnboardingGoalsStep: Saving goals data:', formData);
    
    try {
      const result = await updateProfile(formData as any);
      
      if (result?.error) {
        console.error('OnboardingGoalsStep: Save failed:', result.error);
        toast({
          title: "Save Failed",
          description: "Unable to save your goals. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('OnboardingGoalsStep: Save successful');
      toast({
        title: "Goals Saved",
        description: "Your goals have been saved successfully!"
      });
      onNext();
    } catch (error) {
      console.error('OnboardingGoalsStep: Error updating profile:', error);
      toast({
        title: "Save Failed", 
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = formData.primary_challenge.length > 0;

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="text-center pb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Your Goals</CardTitle>
        <p className="text-sm text-muted-foreground">
          Help our AI recommend the perfect solutions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="primary_challenge">What's your biggest challenge?</Label>
          <Select 
            value={formData.primary_challenge} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, primary_challenge: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your main challenge" />
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

        <div>
          <Label htmlFor="budget_preference">Investment Comfort Level</Label>
          <Select 
            value={formData.budget_preference} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, budget_preference: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low_cost">Conservative - Under $500/month</SelectItem>
              <SelectItem value="balanced">Balanced - $500-2000/month</SelectItem>
              <SelectItem value="high_investment">Aggressive - $2000+/month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Recommendations</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on your challenge and budget, we'll recommend the most effective solutions from our marketplace.
          </p>
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid || isLoading}
            className="w-full"
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}