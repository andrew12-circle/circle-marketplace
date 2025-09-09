
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentData } from "@/hooks/useAgentData";

import { ConversationalRefinement } from "./ConversationalRefinement";
import { RecommendationsHeader } from "./RecommendationsHeader";
import { ProfileCompletionAlert } from "./ProfileCompletionAlert";
import { SimplePlanDisplay } from "./SimplePlanDisplay";
import { AutoRecoverySystem } from "./AutoRecoverySystem";
import { useAutoRecovery } from "@/hooks/useAutoRecovery";

export function AIRecommendationsDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { agent, stats: agentStats, loading: agentLoading, error: agentError } = useAgentData();
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [showRefinement, setShowRefinement] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  
  // Auto-recovery system
  const { triggerRecovery, isRecovering, canAutoRecover } = useAutoRecovery({
    enabled: true,
    errorThreshold: 1,
    autoTriggerDelay: 1000
  });

  useEffect(() => {
    if (user?.id) {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Handle agent data loading errors
  useEffect(() => {
    if (agentError && !agentLoading) {
      setErrorCount(prev => prev + 1);
      
      // Auto-trigger recovery on first error if we can
      if (canAutoRecover && errorCount === 0) {
        console.log('🔧 AI Dashboard: Auto-triggering recovery due to agent data error');
        setTimeout(() => {
          triggerRecovery();
        }, 1000);
      }
    } else if (agent && !agentError) {
      // Reset error count when data loads successfully
      setErrorCount(0);
    }
  }, [agentError, agentLoading, agent, canAutoRecover, triggerRecovery, errorCount]);

  // Handle prolonged loading states
  useEffect(() => {
    if (agentLoading && !agent) {
      // If loading for more than 8 seconds, show recovery option
      const timeout = setTimeout(() => {
        if (agentLoading && !agent) {
          setErrorCount(prev => prev + 1);
        }
      }, 8000);
      
      return () => clearTimeout(timeout);
    }
  }, [agentLoading, agent]);

  // Force re-render when profile updates (moved here to maintain hook order)
  useEffect(() => {
    // This will cause the component to re-render when profile data changes
    if (profile) {
      const targetValue = (profile as any)?.annual_goal_transactions;
      console.log('Profile updated, annual_goal_transactions:', targetValue);
    }
  }, [(profile as any)?.annual_goal_transactions]);

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
        description: `Please complete the comprehensive questionnaire: ${requirements.missing.join(', ')}`,
        variant: "destructive"
      });
      navigate('/agent-questionnaire');
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

  const handleRecoveryComplete = () => {
    setErrorCount(0);
    // Force a refresh of agent data by clearing any cached state
    window.location.reload();
  };

  if (isLoading || (agentLoading && !agentError)) {
    return (
      <div className="space-y-4">
        {/* Show recovery system if we have errors or prolonged loading */}
        {(agentError || errorCount > 0) && (
          <AutoRecoverySystem
            isError={!!agentError || errorCount > 0}
            errorCount={errorCount}
            onRecoveryComplete={handleRecoveryComplete}
          />
        )}
        
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-48 bg-muted rounded-lg animate-pulse" />
        
        {/* Show helpful message if loading takes too long */}
        {agentLoading && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Loading your personalized recommendations...
            </p>
          </div>
        )}
      </div>
    );
  }

  const requirements = checkDataRequirements();
  const currentTransactions = (agentStats?.buyerDeals || 0) + (agentStats?.sellerDeals || 0);
  const targetTransactions = (profile as any)?.annual_goal_transactions || (currentTransactions * 1.5) || 40;
  const personalityType = (profile as any)?.personality_data?.personality_type || null;

  return (
    <div className="space-y-6" data-tour="ai-plan-display">
      {/* Show recovery system if we have errors */}
      {(agentError || errorCount > 0) && (
        <AutoRecoverySystem
          isError={!!agentError || errorCount > 0}
          errorCount={errorCount}
          onRecoveryComplete={handleRecoveryComplete}
        />
      )}

      <RecommendationsHeader
        personalityType={personalityType}
        currentTransactions={currentTransactions}
        targetTransactions={targetTransactions}
        isGenerating={isGenerating}
        hasCompleteProfile={requirements.isComplete}
        onGenerateRecommendations={generateAIRecommendations}
        onOpenAssessment={() => navigate('/agent-questionnaire')}
      />

      {!requirements.isComplete && (
        <ProfileCompletionAlert
          missingItems={requirements.missing as string[]}
          onComplete={() => navigate('/agent-questionnaire')}
        />
      )}

      {currentPlan && (
        <SimplePlanDisplay plan={currentPlan} />
      )}

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
    </div>
  );
}
