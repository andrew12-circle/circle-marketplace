import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentData } from '@/hooks/useAgentData';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, CheckCircle } from 'lucide-react';

interface OnboardingNumbersStepProps {
  onNext: () => void;
}

export function OnboardingNumbersStep({ onNext }: OnboardingNumbersStepProps) {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const { stats } = useAgentData(12); // Get last 12 months
  const [formData, setFormData] = useState({
    years_experience: profile?.years_experience || 3,
    annual_transactions: 12,
    annual_volume: 3000000
  });
  const [isLoading, setIsLoading] = useState(false);

  // Prefill with agent data if available
  useEffect(() => {
    if (stats) {
      setFormData(prev => ({
        ...prev,
        annual_transactions: (stats.buyerDeals + stats.sellerDeals) || prev.annual_transactions,
        annual_volume: Math.round(stats.totalVolume) || prev.annual_volume
      }));
    }
  }, [stats]);

  const handleSubmit = async () => {
    setIsLoading(true);
    const updateData = {
      years_experience: formData.years_experience,
      annual_goal_transactions: formData.annual_transactions,
      annual_goal_volume: formData.annual_volume
    };
    console.log('OnboardingNumbersStep: Saving numbers data:', updateData);
    
    try {
      const result = await updateProfile(updateData as any);
      
      if (result?.error) {
        console.error('OnboardingNumbersStep: Save failed:', result.error);
        toast({
          title: "Save Failed",
          description: "Unable to save your experience details. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('OnboardingNumbersStep: Save successful');
      toast({
        title: "Experience Saved",
        description: "Your experience details have been saved successfully!"
      });
      onNext();
    } catch (error) {
      console.error('OnboardingNumbersStep: Error updating profile:', error);
      toast({
        title: "Save Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasPrefillData = stats && (stats.buyerDeals + stats.sellerDeals) > 0;

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="text-center pb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Your Numbers</CardTitle>
        <p className="text-sm text-muted-foreground">
          {hasPrefillData ? "We found your transaction data! Please verify:" : "Help us understand your experience level"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPrefillData && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Data Found</span>
            </div>
            <p className="text-xs text-muted-foreground">
              We've prefilled based on your transaction history. Adjust if needed.
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="years_experience">Years of Experience</Label>
          <Input
            id="years_experience"
            type="number"
            min="0"
            max="50"
            value={formData.years_experience}
            onChange={(e) => setFormData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
          />
        </div>
        
        <div>
          <Label htmlFor="annual_transactions">Annual Transactions</Label>
          <Input
            id="annual_transactions"
            type="number"
            min="0"
            value={formData.annual_transactions}
            onChange={(e) => setFormData(prev => ({ ...prev, annual_transactions: parseInt(e.target.value) || 0 }))}
            placeholder="e.g., 12"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Deals you close per year
          </p>
        </div>

        <div>
          <Label htmlFor="annual_volume">Annual Volume ($)</Label>
          <Input
            id="annual_volume"
            type="number"
            min="0"
            value={formData.annual_volume}
            onChange={(e) => setFormData(prev => ({ ...prev, annual_volume: parseInt(e.target.value) || 0 }))}
            placeholder="e.g., 3000000"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Total dollar volume per year
          </p>
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}