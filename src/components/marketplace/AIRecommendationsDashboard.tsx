
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentData } from "@/hooks/useAgentData";
import { GoalAssessmentModal } from "./GoalAssessmentModal";
import { ConversationalRefinement } from "./ConversationalRefinement";
import { RecommendationsHeader } from "./RecommendationsHeader";
import { ProfileCompletionAlert } from "./ProfileCompletionAlert";
import { SimplePlanDisplay } from "./SimplePlanDisplay";
import { SuccessPathScore } from "./SuccessPathScore";
import { PeerComparison } from "./PeerComparison";

export function AIRecommendationsDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { agent, stats: agentStats, loading: agentLoading } = useAgentData();
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalAssessmentOpen, setIsGoalAssessmentOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [showRefinement, setShowRefinement] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setIsLoading(false);
    }
    
    // Fallback timeout to prevent indefinite loading
    const fallbackTimeout = setTimeout(() => {
      if (isLoading || agentLoading) {
        console.warn('Agent data loading timeout - proceeding with fallback');
        setIsLoading(false);
      }
    }, 10000);
    
    return () => clearTimeout(fallbackTimeout);
  }, [user?.id, isLoading, agentLoading]);

  const checkDataRequirements = () => {
    const hasProfile = user?.id;
    const hasGoalAssessment = (profile as any)?.goal_assessment_completed;
    const hasPersonalityData = (profile as any)?.personality_data?.personality_type;
    const hasCurrentTools = (profile as any)?.current_tools && Object.keys((profile as any).current_tools).length > 0;
    const hasGoals = (profile as any)?.annual_goal_transactions || (profile as any)?.primary_challenge;
    
    // Make performance data optional - use defaults if not available
    const hasBasicRequirements = hasProfile && hasGoalAssessment && hasPersonalityData && hasCurrentTools && hasGoals;
    
    return {
      isComplete: hasBasicRequirements,
      missing: [
        !hasGoalAssessment && 'Goal Assessment',
        !hasPersonalityData && 'Personality Profile', 
        !hasCurrentTools && 'Current Tools',
        !hasGoals && 'Business Goals'
      ].filter(Boolean)
    };
  };

  const generateAIRecommendations = async () => {
    if (!user?.id) {
      toast({ title: "Sign in required", description: "Please sign in to generate AI recommendations.", variant: "destructive" });
      return;
    }

    const requirements = checkDataRequirements();
    if (!requirements.isComplete) {
      toast({
        title: "Missing Information",
        description: `Please complete: ${requirements.missing.join(', ')}`,
        variant: "destructive"
      });
      setIsGoalAssessmentOpen(true);
      return;
    }

    setIsGenerating(true);
    
    try {
      const currentTransactions = (agentStats?.buyerDeals || 0) + (agentStats?.sellerDeals || 0);
      const targetTransactions = (profile as any)?.annual_goal_transactions || Math.max(currentTransactions * 1.5, 40);
      
      const { data, error } = await supabase.functions.invoke('generate-goal-plan', {
        body: {
          goalTitle: `Path to ${targetTransactions} Transactions`,
          goalDescription: `Grow from ${currentTransactions} to ${targetTransactions} transactions using strategies that match your personality and work style`,
          timeframeWeeks: 52,
          budgetMin: 500,
          budgetMax: 2000
        }
      });

      if (error) throw error;

      if (data?.plan) {
        setCurrentPlan(data.plan);
        setShowRefinement(true);
        
        toast({
          title: "Your Path to Success is Ready!",
          description: `Generated a personalized plan to reach ${targetTransactions} transactions.`
        });
      }
    } catch (error: any) {
      console.error('Error generating AI recommendations:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || agentLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-48 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  const requirements = checkDataRequirements();
  const currentTransactions = (agentStats?.buyerDeals || 0) + (agentStats?.sellerDeals || 0);
  const targetTransactions = (profile as any)?.annual_goal_transactions || Math.max(currentTransactions * 1.5, 40);
  const personalityType = (profile as any)?.personality_data?.personality_type || null;

  return (
    <div className="space-y-6">
      <RecommendationsHeader
        personalityType={personalityType}
        currentTransactions={currentTransactions}
        targetTransactions={targetTransactions}
        isGenerating={isGenerating}
        hasCompleteProfile={requirements.isComplete}
        onGenerateRecommendations={generateAIRecommendations}
        onOpenAssessment={() => setIsGoalAssessmentOpen(true)}
      />

      {!requirements.isComplete && (
        <ProfileCompletionAlert
          missingItems={requirements.missing as string[]}
          onComplete={() => setIsGoalAssessmentOpen(true)}
        />
      )}

      {currentPlan && (
        <SimplePlanDisplay plan={currentPlan} />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <SuccessPathScore />
        <PeerComparison />
      </div>

      {showRefinement && currentPlan && (
        <div className="mb-6">
          <ConversationalRefinement
            currentPlan={currentPlan}
            onPlanUpdated={(newPlan) => {
              setCurrentPlan(newPlan);
              toast({
                title: "Plan Updated",
                description: "Your growth plan has been refined based on your feedback."
              });
            }}
          />
        </div>
      )}

      <GoalAssessmentModal
        open={isGoalAssessmentOpen}
        onOpenChange={setIsGoalAssessmentOpen}
        onComplete={() => {
          setIsGoalAssessmentOpen(false);
          setTimeout(() => {
            generateAIRecommendations();
          }, 1000);
        }}
      />
    </div>
  );
}
