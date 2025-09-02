import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLogPageViewOnce } from "@/hooks/useLogPageViewOnce";
import { GoalFormData } from "./types";
import { GoalAssessmentStep1 } from "./GoalAssessmentStep1";
import { GoalAssessmentStep2 } from "./GoalAssessmentStep2";
import { GoalAssessmentStep3 } from "./GoalAssessmentStep3";
import { GoalAssessmentStep4 } from "./GoalAssessmentStep4";
import { GoalAssessmentStep5 } from "./GoalAssessmentStep5";
import { GoalAssessmentStep6 } from "./GoalAssessmentStep6";

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

  // Load profile data when modal opens
  useEffect(() => {
    if (open && profile) {
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
    }
  }, [open]);

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const handleUpdate = (field: keyof GoalFormData, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.annual_goal_transactions > 0 && formData.annual_goal_volume > 0;
      case 2:
        return formData.average_commission_per_deal > 0;
      case 3:
        return !!formData.primary_challenge && formData.primary_challenge.trim() !== '';
      case 4:
        return formData.marketing_time_per_week >= 0;
      case 5:
        return !!formData.personality_type && !!formData.work_style;
      case 6:
        return !!formData.current_crm;
      default:
        return true;
    }
  };

  const handleComplete = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
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

      toast({
        title: "Goals Set Successfully!",
        description: "We'll now personalize your marketplace recommendations based on your goals.",
      });

      onComplete?.();
      setModalDismissed(true);
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

  // Allow users to close modal even if not complete
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setModalDismissed(true);
    }
    onOpenChange(open);
  };

  // Don't show modal if user has dismissed it
  if (modalDismissed && !open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-md">
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
          {renderCurrentStep()}
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep === TOTAL_STEPS ? (
              <Button 
                onClick={handleComplete}
                disabled={isLoading || !isStepValid(currentStep)}
              >
                {isLoading ? "Saving..." : "Complete Setup"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
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