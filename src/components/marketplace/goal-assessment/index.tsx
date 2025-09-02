import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLogPageViewOnce } from "@/hooks/useLogPageViewOnce";
import { logServiceEvent } from "@/lib/events";
import { GoalFormData } from "./types";
import { GoalAssessmentStep1 } from "./GoalAssessmentStep1";
import { GoalAssessmentStep2 } from "./GoalAssessmentStep2";
import { GoalAssessmentStep3 } from "./GoalAssessmentStep3";
import { GoalAssessmentStep4 } from "./GoalAssessmentStep4";
import { GoalAssessmentStep5 } from "./GoalAssessmentStep5";
import { GoalAssessmentStep6 } from "./GoalAssessmentStep6";
import { X } from "lucide-react";
import { 
  AssessmentSchema, 
  Step1Schema, 
  Step2Schema, 
  Step3Schema, 
  Step4Schema, 
  Step5Schema, 
  Step6Schema 
} from "@/features/assessment/schema";

interface GoalAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const TOTAL_STEPS = 6;

const DEFAULT_FORM_DATA: GoalFormData = {
  annual_goal_transactions: 12,
  annual_goal_volume: 3000000,
  average_commission_per_deal: 5000,
  primary_challenge: '',
  marketing_time_per_week: 5,
  budget_preference: 'balanced',
  personality_type: '',
  work_style: '',
  communication_preference: '',
  lead_source_comfort: [],
  current_crm: '',
  current_dialer: '',
  current_marketing_tools: [],
  social_media_usage: ''
};

export function GoalAssessmentModal({ open, onOpenChange, onComplete }: GoalAssessmentModalProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  useLogPageViewOnce('assessment_viewed', '/assessment');
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>(DEFAULT_FORM_DATA);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load profile data when modal opens
  useEffect(() => {
    if (open && profile && !formData.primary_challenge) {
      const personalityData = (profile as any).personality_data || {};
      const currentTools = (profile as any).current_tools || {};
      
      setFormData({
        annual_goal_transactions: (profile as any).annual_goal_transactions ?? 12,
        annual_goal_volume: (profile as any).annual_goal_volume ?? 3000000,
        average_commission_per_deal: (profile as any).average_commission_per_deal ?? 5000,
        primary_challenge: (profile as any).primary_challenge ?? '',
        marketing_time_per_week: (profile as any).marketing_time_per_week ?? 5,
        budget_preference: (profile as any).budget_preference ?? 'balanced',
        personality_type: personalityData.personality_type ?? '',
        work_style: personalityData.work_style ?? '',
        communication_preference: personalityData.communication_preference ?? '',
        lead_source_comfort: personalityData.lead_source_comfort ?? [],
        current_crm: currentTools.crm ?? '',
        current_dialer: currentTools.dialer ?? '',
        current_marketing_tools: currentTools.marketing_tools ?? [],
        social_media_usage: currentTools.social_media_usage ?? ''
      });
    }
  }, [open, profile]);

  // Reset to step 1 when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setError(null);
    }
  }, [open]);

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const handleUpdate = (field: keyof GoalFormData, value: string | number | string[]) => {
    console.log('Updating field:', field, 'with value:', value);
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log('New formData:', newData);
      return newData;
    });
    setError(null); // Clear any validation errors when user makes changes
  };

  // Improved validation using Zod schemas
  const isStepValid = (step: number): boolean => {
    try {
      switch (step) {
        case 1:
          Step1Schema.parse({
            annual_goal_transactions: formData.annual_goal_transactions,
            annual_goal_volume: formData.annual_goal_volume
          });
          return true;
        case 2:
          Step2Schema.parse({
            average_commission_per_deal: formData.average_commission_per_deal
          });
          return true;
        case 3:
          Step3Schema.parse({
            primary_challenge: formData.primary_challenge
          });
          return true;
        case 4:
          Step4Schema.parse({
            marketing_time_per_week: formData.marketing_time_per_week,
            budget_preference: formData.budget_preference
          });
          return true;
        case 5:
          Step5Schema.parse({
            personality_type: formData.personality_type,
            work_style: formData.work_style,
            communication_preference: formData.communication_preference
          });
          return true;
        case 6:
          Step6Schema.parse({
            current_crm: formData.current_crm
          });
          return true;
        default:
          return true;
      }
    } catch {
      return false;
    }
  };

  const handleNext = async () => {
    setError(null);
    
    if (!isStepValid(currentStep)) {
      setError('Please complete all required fields before proceeding.');
      return;
    }

    // Log step completion
    void logServiceEvent({
      event_type: 'assessment_step',
      page: '/assessment',
      context: { step: currentStep, totalSteps: TOTAL_STEPS }
    });

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleComplete = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Final validation before submission
      AssessmentSchema.parse(formData);
      
      const personalityData = {
        personality_type: formData.personality_type,
        work_style: formData.work_style,
        communication_preference: formData.communication_preference,
        lead_source_comfort: formData.lead_source_comfort
      };
      
      const currentTools = {
        crm: formData.current_crm,
        dialer: formData.current_dialer,
        marketing_tools: formData.current_marketing_tools,
        social_media_usage: formData.social_media_usage
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          annual_goal_transactions: formData.annual_goal_transactions,
          annual_goal_volume: formData.annual_goal_volume,
          average_commission_per_deal: formData.average_commission_per_deal,
          primary_challenge: formData.primary_challenge,
          marketing_time_per_week: formData.marketing_time_per_week,
          budget_preference: formData.budget_preference,
          personality_data: personalityData,
          current_tools: currentTools,
          goal_assessment_completed: true,
          last_assessment_date: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Log completion
      void logServiceEvent({
        event_type: 'assessment_completed',
        page: '/assessment',
        context: { totalSteps: TOTAL_STEPS, formData }
      });

      toast({
        title: "Goals Set Successfully!",
        description: "We'll now personalize your marketplace recommendations based on your goals.",
      });

      onComplete?.();
      setModalDismissed(true);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving goals:', error);
      const errorMessage = error?.message || 'Failed to save your goals. Please try again.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <GoalAssessmentStep1 formData={formData} onUpdate={handleUpdate} />;
      case 2:
        return <GoalAssessmentStep2 formData={formData} onUpdate={handleUpdate} />;
      case 3:
        return <GoalAssessmentStep3 formData={formData} onUpdate={handleUpdate} />;
      case 4:
        return <GoalAssessmentStep4 formData={formData} onUpdate={handleUpdate} />;
      case 5:
        return <GoalAssessmentStep5 formData={formData} onUpdate={handleUpdate} />;
      case 6:
        return <GoalAssessmentStep6 formData={formData} onUpdate={handleUpdate} />;
      default:
        return null;
    }
  };

  // Proper modal close handler that respects onOpenChange
  const handleModalClose = (shouldClose: boolean) => {
    if (!shouldClose) return;
    
    setModalDismissed(true);
    onOpenChange(false);
  };

  const handleCancel = () => {
    handleModalClose(true);
  };

  // Don't show modal if user has dismissed it
  if (modalDismissed && !open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent 
        className="max-w-md"
        onEscapeKeyDown={() => handleModalClose(true)}
        onPointerDownOutside={() => handleModalClose(true)}
      >
        <DialogHeader>
          <DialogTitle>Let's Set Your Goals</DialogTitle>
          <DialogDescription>
            Answer a few quick questions so we can tailor your marketplace recommendations to your specific business goals and preferences.
          </DialogDescription>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep} of {TOTAL_STEPS}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          
          {renderCurrentStep()}
          
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              
              {currentStep === TOTAL_STEPS ? (
                <Button 
                  type="button"
                  onClick={handleComplete}
                  disabled={isLoading || !isStepValid(currentStep)}
                >
                  {isLoading ? "Saving..." : "Complete Setup"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep)}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}