import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentData } from "@/hooks/useAgentData";
import { Target, TrendingUp, Clock, ShoppingCart, Eye, X, CheckCircle, Sparkles, AlertCircle, BookOpen, Bot } from "lucide-react";
import { GoalAssessmentModal } from "./GoalAssessmentModal";
import { ConversationalRefinement } from "./ConversationalRefinement";
import { useGoalPlan } from "@/hooks/useGoalPlan";

interface Recommendation {
  id: string;
  recommendation_type: string;
  recommendation_text: string;
  confidence_score: number;
  estimated_roi_percentage: number;
  priority_rank: number;
  service_id?: string;
  bundle_id?: string;
  is_viewed: boolean;
  is_accepted: boolean;
  is_dismissed: boolean;
  created_at: string;
}

interface ServiceBundle {
  id: string;
  bundle_name: string;
  bundle_type: string;
  description: string;
  estimated_roi_percentage: number;
  implementation_timeline_weeks: number;
  total_price: number;
  service_ids: string[];
}

export function AIRecommendationsDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { agent, stats: agentStats, loading: agentLoading } = useAgentData();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalAssessmentOpen, setIsGoalAssessmentOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingRequirements, setIsCheckingRequirements] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [showRefinement, setShowRefinement] = useState(false);
  const { isBuilding, buildPlan } = useGoalPlan();

  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
      loadServiceBundles();
    }
  }, [user?.id]);

  const loadRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('goal_based_recommendations')
        .select('*')
        .eq('agent_id', user?.id)
        .eq('is_dismissed', false)
        .order('priority_rank', { ascending: true })
        .limit(5);

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const loadServiceBundles = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_service_bundles')
        .select('*')
        .eq('is_active', true)
        .order('estimated_roi_percentage', { ascending: false })
        .limit(3);

      if (error) throw error;
      setBundles(data || []);
    } catch (error) {
      console.error('Error loading service bundles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkDataRequirements = () => {
    const hasProfile = user?.id;
    const hasGoalAssessment = (profile as any)?.goal_assessment_completed;
    const hasPersonalityData = (profile as any)?.personality_data?.personality_type;
    const hasCurrentTools = (profile as any)?.current_tools && Object.keys((profile as any).current_tools).length > 0;
    const hasGoals = (profile as any)?.annual_goal_transactions || (profile as any)?.primary_challenge;
    
    // Check if we have recent performance data from useAgentData
    const hasPerformanceData = agentStats?.dealCount !== undefined;
    
    return {
      hasProfile,
      hasGoalAssessment,
      hasPersonalityData,
      hasCurrentTools,
      hasGoals,
      hasPerformanceData,
      isComplete: hasProfile && hasGoalAssessment && hasPersonalityData && hasCurrentTools && hasGoals && hasPerformanceData,
      missing: [
        !hasGoalAssessment && 'Goal Assessment',
        !hasPersonalityData && 'Personality Profile',
        !hasCurrentTools && 'Current Tools',
        !hasGoals && 'Business Goals',
        !hasPerformanceData && 'Performance Data'
      ].filter(Boolean)
    };
  };

  const getBudgetRange = () => {
    const budgetPref = (profile as any)?.budget_preference || 'balanced';
    switch (budgetPref) {
      case 'low_cost': return { min: 100, max: 500 };
      case 'high_investment': return { min: 2000, max: 5000 };
      default: return { min: 500, max: 2000 };
    }
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
      const budgetRange = getBudgetRange();
      const currentTransactions = agentStats?.dealCount || 0;
      const targetTransactions = (profile as any)?.annual_goal_transactions || Math.max(currentTransactions * 1.5, 40);
      
      // Use the goal plan generation for personality-aware planning
      const { data, error } = await supabase.functions.invoke('generate-goal-plan', {
        body: {
          goalTitle: `Path to ${targetTransactions} Transactions`,
          goalDescription: `Grow from ${currentTransactions} to ${targetTransactions} transactions using strategies that match your personality and work style`,
          timeframeWeeks: 52,
          budgetMin: budgetRange.min,
          budgetMax: budgetRange.max
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

      // Also load regular recommendations
      loadRecommendations();
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

  const markAsViewed = async (recommendationId: string) => {
    try {
      await supabase
        .from('goal_based_recommendations')
        .update({ is_viewed: true })
        .eq('id', recommendationId);
    } catch (error) {
      console.error('Error marking recommendation as viewed:', error);
    }
  };

  const handleAcceptRecommendation = async (recommendation: Recommendation) => {
    try {
      await supabase
        .from('goal_based_recommendations')
        .update({ is_accepted: true })
        .eq('id', recommendation.id);

      setRecommendations(prev => 
        prev.map(r => r.id === recommendation.id ? { ...r, is_accepted: true } : r)
      );

      toast({
        title: "Recommendation Accepted",
        description: "We'll track the impact of this recommendation on your business.",
      });
    } catch (error) {
      console.error('Error accepting recommendation:', error);
    }
  };

  const handleDismissRecommendation = async (recommendationId: string) => {
    try {
      await supabase
        .from('goal_based_recommendations')
        .update({ is_dismissed: true })
        .eq('id', recommendationId);

      setRecommendations(prev => prev.filter(r => r.id !== recommendationId));

      toast({
        title: "Recommendation Dismissed",
        description: "This recommendation won't be shown again.",
      });
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
    }
  };

  const getBundleTypeLabel = (type: string) => {
    switch (type) {
      case 'low_cost_quick_wins':
        return 'Quick Wins';
      case 'balanced_growth':
        return 'Balanced Growth';
      case 'high_investment_returns':
        return 'High Investment';
      default:
        return type;
    }
  };

  const getBundleTypeColor = (type: string) => {
    switch (type) {
      case 'low_cost_quick_wins':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'balanced_growth':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'high_investment_returns':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
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
  const currentTransactions = agentStats?.dealCount || 0;
  const targetTransactions = (profile as any)?.annual_goal_transactions || Math.max(currentTransactions * 1.5, 40);
  const personalityType = (profile as any)?.personality_data?.personality_type || null;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {personalityType ? `Your ${personalityType} Growth Path` : 'Your Personalized Recommendations'}
          </h2>
          <p className="text-muted-foreground">
            {currentTransactions > 0 ? (
              `Grow from ${currentTransactions} to ${targetTransactions} transactions with personalized strategies`
            ) : (
              'AI-powered recommendations based on your business goals and market data'
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={generateAIRecommendations} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Bot className="h-4 w-4 mr-2 animate-pulse" />
                Building Your Path...
              </>
            ) : requirements.isComplete ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Build My Path to {targetTransactions}
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Complete Setup
              </>
            )}
          </Button>
          <Button variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            AI Strategy Guide
          </Button>
        </div>
      </div>

      {/* Requirements Status */}
      {!requirements.isComplete && (
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/20 mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-800 dark:text-orange-200">
                  Complete Your Profile for Personalized Recommendations
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                  Missing: {requirements.missing.join(', ')}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setIsGoalAssessmentOpen(true)}
                >
                  Complete Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan Display */}
      {currentPlan && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {currentPlan.goal_title}
                </CardTitle>
                <CardDescription>{currentPlan.summary}</CardDescription>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {currentPlan.confidence ? `${Math.round(currentPlan.confidence * 100)}% Match` : 'Generated'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {currentPlan.current_performance && (
              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-background/50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-primary">{currentPlan.current_performance.transactions}</div>
                  <div className="text-sm text-muted-foreground">Current Transactions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{currentPlan.current_performance.gap_to_close}</div>
                  <div className="text-sm text-muted-foreground">Gap to Close</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{currentPlan.timeframe_weeks}w</div>
                  <div className="text-sm text-muted-foreground">Timeline</div>
                </div>
              </div>
            )}

            {currentPlan.phases && (
              <div className="space-y-3">
                <h4 className="font-medium">Growth Phases</h4>
                {currentPlan.phases.map((phase: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-background/30 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{phase.name}</div>
                      <div className="text-sm text-muted-foreground">{phase.steps?.[0]?.expected_impact}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">{phase.weeks} weeks</div>
                      <div className="text-sm text-muted-foreground">{phase.steps?.length} steps</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conversational Refinement */}
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

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>
                  Personalized suggestions based on your profile and goals
                </CardDescription>
              </div>
              {/* Removed edit goals and build plan buttons to simplify */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="border rounded-lg p-4 space-y-3"
                  onMouseEnter={() => !recommendation.is_viewed && markAsViewed(recommendation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {recommendation.recommendation_type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(recommendation.confidence_score * 100)}% confidence
                        </Badge>
                        {recommendation.estimated_roi_percentage > 0 && (
                          <Badge variant="default" className="text-xs">
                            {recommendation.estimated_roi_percentage}% ROI
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{recommendation.recommendation_text}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismissRecommendation(recommendation.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRecommendation(recommendation)}
                      disabled={recommendation.is_accepted}
                    >
                      {recommendation.is_accepted ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accepted
                        </>
                      ) : (
                        'Accept'
                      )}
                    </Button>
                    
                    {recommendation.service_id && (
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Service
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Bundles */}
      {bundles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Curated Service Bundles
                </CardTitle>
                <CardDescription>
                  Optimized packages for your business goals
                </CardDescription>
              </div>
              {/* Removed edit goals and build plan buttons to simplify */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {bundles.map((bundle) => (
                <div key={bundle.id} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{bundle.bundle_name}</h4>
                      <Badge className={getBundleTypeColor(bundle.bundle_type)}>
                        {getBundleTypeLabel(bundle.bundle_type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{bundle.description}</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Estimated ROI:</span>
                      <span className="font-medium text-green-600">
                        {bundle.estimated_roi_percentage}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timeline:</span>
                      <span className="font-medium">
                        {bundle.implementation_timeline_weeks} weeks
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Price:</span>
                      <span className="font-medium">
                        ${bundle.total_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <Button className="w-full" size="sm">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Add Bundle to Cart
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <GoalAssessmentModal
        open={isGoalAssessmentOpen}
        onOpenChange={setIsGoalAssessmentOpen}
        onComplete={() => {
          setIsGoalAssessmentOpen(false);
          // Reload data to reflect new assessment
          setTimeout(() => {
            generateAIRecommendations();
          }, 1000);
        }}
      />
    </div>
  );
}
