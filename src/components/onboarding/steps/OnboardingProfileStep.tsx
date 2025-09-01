import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, MapPin } from 'lucide-react';

interface OnboardingProfileStepProps {
  onNext: () => void;
}

export function OnboardingProfileStep({ onNext }: OnboardingProfileStepProps) {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    business_name: profile?.business_name || '',
    city: profile?.city || '',
    state: profile?.state || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    console.log('OnboardingProfileStep: Saving profile data:', formData);
    
    try {
      const result = await updateProfile(formData);
      
      if (result?.error) {
        console.error('OnboardingProfileStep: Save failed:', result.error);
        toast({
          title: "Save Failed",
          description: "Unable to save your profile. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('OnboardingProfileStep: Save successful');
      toast({
        title: "Profile Saved",
        description: "Your profile has been saved successfully!"
      });
      onNext();
    } catch (error) {
      console.error('OnboardingProfileStep: Error updating profile:', error);
      toast({
        title: "Save Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = formData.display_name.trim().length > 0;

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="text-center pb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <User className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Quick Profile Setup</CardTitle>
        <p className="text-sm text-muted-foreground">
          Help us personalize your experience
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="display_name">Your Name *</Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
            placeholder="e.g., Sarah Johnson"
          />
        </div>
        
        <div>
          <Label htmlFor="business_name">Business/Brokerage</Label>
          <Input
            id="business_name"
            value={formData.business_name}
            onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
            placeholder="e.g., Keller Williams"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Nashville"
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              placeholder="TN"
              maxLength={2}
            />
          </div>
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