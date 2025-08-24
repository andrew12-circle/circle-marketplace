import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ResponsiveLogo } from '@/components/ui/optimized-image';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  User, 
  TrendingUp, 
  Target, 
  ShoppingBag, 
  GraduationCap,
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react';
import { OnboardingProfileStep } from './steps/OnboardingProfileStep';
import { OnboardingNumbersStep } from './steps/OnboardingNumbersStep';
import { OnboardingGoalsStep } from './steps/OnboardingGoalsStep';
import { OnboardingMarketplaceStep } from './steps/OnboardingMarketplaceStep';
import { OnboardingAcademyStep } from './steps/OnboardingAcademyStep';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Star },
  { id: 'profile', title: 'Profile', icon: User },
  { id: 'numbers', title: 'Numbers', icon: TrendingUp },
  { id: 'goals', title: 'Goals', icon: Target },
  { id: 'marketplace', title: 'Marketplace', icon: ShoppingBag },
  { id: 'academy', title: 'Academy', icon: GraduationCap }
];

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { onboardingState, moveToStep, completeOnboarding, dismissOnboarding } = useOnboardingState();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    const stepIndex = STEPS.findIndex(step => step.id === onboardingState?.current_step);
    return stepIndex >= 0 ? stepIndex : 0;
  });

  const currentStep = STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleNext = async () => {
    if (currentStepIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentStepIndex + 1];
      await moveToStep(nextStep.id);
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      await handleComplete();
    }
  };

  const handleSkip = async () => {
    await dismissOnboarding();
    navigate('/');
    toast({
      title: "Setup skipped",
      description: "You can complete your profile anytime from settings."
    });
  };

  const handleComplete = async () => {
    await completeOnboarding();
    navigate('/');
    toast({
      title: "Welcome to Circle!",
      description: "Your account is ready. Let's explore what we can do together!"
    });
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'welcome':
        return (
          <Card className="border-none shadow-none">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Welcome to Circle!</CardTitle>
              <p className="text-muted-foreground">
                Let's get you set up in under 2 minutes. We'll show you everything that can help grow your business.
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-muted/30 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium mb-2">What you'll discover:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary">AI Recommendations</Badge>
                  <Badge variant="secondary">Co-Pay Marketplace</Badge>
                  <Badge variant="secondary">Academy & Playbooks</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'profile':
        return <OnboardingProfileStep onNext={handleNext} />;
      
      case 'numbers':
        return <OnboardingNumbersStep onNext={handleNext} />;
      
      case 'goals':
        return <OnboardingGoalsStep onNext={handleNext} />;
      
      case 'marketplace':
        return <OnboardingMarketplaceStep onNext={handleNext} />;
      
      case 'academy':
        return <OnboardingAcademyStep onNext={handleNext} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <ResponsiveLogo className="h-8 w-8" />
            <h1 className="text-xl font-bold">Setup</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            <X className="h-4 w-4 mr-1" />
            Skip for now
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {STEPS.length}
            </span>
            <span className="text-sm font-medium">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step indicators */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div
                  key={step.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isCompleted
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-background rounded-lg border shadow-sm p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        {currentStep.id === 'welcome' && (
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleSkip}>
              Skip Setup
            </Button>
            <Button onClick={handleNext} className="min-w-[120px]">
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Save & Exit option for non-welcome steps */}
        {currentStep.id !== 'welcome' && (
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Save & finish later
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}