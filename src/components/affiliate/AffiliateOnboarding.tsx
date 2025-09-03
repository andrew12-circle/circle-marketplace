import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowRight, Upload, CreditCard, Link as LinkIcon } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export const AffiliateOnboarding = ({ affiliateId }: { affiliateId: string }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'tax_info',
      title: 'Tax Information',
      description: 'Upload your W-9 or tax documents',
      completed: false,
      required: true
    },
    {
      id: 'payout_setup',
      title: 'Payout Method',
      description: 'Configure how you want to receive payments',
      completed: false,
      required: true
    },
    {
      id: 'marketing_assets',
      title: 'Marketing Assets',
      description: 'Download promotional materials and get your links',
      completed: false,
      required: false
    },
    {
      id: 'terms_agreement',
      title: 'Final Agreement',
      description: 'Review and sign the affiliate agreement',
      completed: false,
      required: true
    }
  ]);

  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  const markStepComplete = async (stepId: string) => {
    try {
      // Update step status in database
      const { error } = await supabase
        .from('affiliates')
        .update({ 
          onboarding_status: stepId === 'terms_agreement' ? 'completed' : 'in_progress'
        })
        .eq('id', affiliateId);

      if (error) throw error;

      setSteps(prev => prev.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      ));

      toast({
        title: "Step completed!",
        description: "Moving to next step...",
      });

      // Move to next incomplete step
      const nextStep = steps.findIndex(s => !s.completed && s.id !== stepId);
      if (nextStep !== -1) {
        setCurrentStep(nextStep);
      }
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      toast({
        title: "Error",
        description: "Failed to update step. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    if (!step) return null;

    switch (step.id) {
      case 'tax_info':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="tax-upload">Upload Tax Documents</Label>
              <Input 
                id="tax-upload" 
                type="file" 
                accept=".pdf,.jpg,.png"
                className="mt-2"
              />
            </div>
            <Button onClick={() => markStepComplete('tax_info')} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Upload & Continue
            </Button>
          </div>
        );

      case 'payout_setup':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => markStepComplete('payout_setup')}
              >
                <CreditCard className="w-6 h-6 mb-2" />
                Stripe Connect
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => markStepComplete('payout_setup')}
              >
                <CreditCard className="w-6 h-6 mb-2" />
                Bank Transfer
              </Button>
            </div>
          </div>
        );

      case 'marketing_assets':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Button variant="outline" className="justify-start">
                <LinkIcon className="w-4 h-4 mr-2" />
                Get Your Affiliate Links
              </Button>
              <Button variant="outline" className="justify-start">
                <Upload className="w-4 h-4 mr-2" />
                Download Marketing Kit
              </Button>
            </div>
            <Button onClick={() => markStepComplete('marketing_assets')} className="w-full">
              Continue
            </Button>
          </div>
        );

      case 'terms_agreement':
        return (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm">
                By completing this onboarding, you agree to the Circle Affiliate Program terms and conditions.
              </p>
            </div>
            <Button onClick={() => markStepComplete('terms_agreement')} className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Onboarding
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Affiliate Onboarding</CardTitle>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{completedSteps} of {totalSteps} completed</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Steps Overview */}
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${index === currentStep ? 'text-primary' : ''}`}>
                    {step.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {step.required && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Required
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">
              {steps[currentStep]?.title}
            </h3>
            {renderStepContent()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};