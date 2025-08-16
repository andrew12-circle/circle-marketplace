import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { ArrowRight, X } from 'lucide-react';

export function OnboardingResumeBanner() {
  const navigate = useNavigate();
  const { onboardingState, dismissOnboarding } = useOnboardingState();

  // Don't show if onboarding is completed, dismissed, or state is loading
  if (!onboardingState || onboardingState.is_completed || onboardingState.dismissed) {
    return null;
  }

  const handleResume = () => {
    navigate('/welcome');
  };

  const handleDismiss = () => {
    dismissOnboarding();
  };

  return (
    <Card className="border-primary/20 bg-primary/5 mb-6">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <div>
            <p className="text-sm font-medium">Complete your setup</p>
            <p className="text-xs text-muted-foreground">
              Finish setting up your profile to get personalized recommendations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleResume}>
            Resume
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}