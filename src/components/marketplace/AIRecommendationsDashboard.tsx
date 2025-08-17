import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Target, TrendingUp, Clock, ShoppingCart, Eye, X, CheckCircle, Sparkles } from "lucide-react";
import { GoalAssessmentModal } from "./GoalAssessmentModal";
import { BuildAIPlanButton } from "@/components/marketplace/BuildAIPlanButton";
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
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalAssessmentOpen, setIsGoalAssessmentOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingRequirements, setIsCheckingRequirements] = useState(false);
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

  const checkDataRequirements = async () => {
    if (!user?.id || !profile) return false;
    
    // Check if user has completed goal assessment with new fields
    const goalAssessmentComplete = (profile as any).goal_assessment_completed;
    const hasPersonalityData = (profile as any).personality_data && Object.keys((profile as any).personality_data).length > 0;
    const hasCurrentTools = (profile as any).current_tools && Object.keys((profile as any).current_tools).length > 0;
    
    // Check if user has any performance data (transactions in last 12 months)
    const { data: agentData } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    let hasPerformanceData = false;
    if (agentData) {
      const { data: performanceData } = await supabase
        .from('agent_quiz_responses')
        .select('id')
        .eq('agent_id', agentData.id)
        .limit(1);
      
      hasPerformanceData = (performanceData && performanceData.length > 0);
    }
    
    return goalAssessmentComplete && hasPersonalityData && hasCurrentTools && hasPerformanceData;
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

    try {
      setIsCheckingRequirements(true);
      
      // Check data requirements first
      const hasRequiredData = await checkDataRequirements();
      if (!hasRequiredData) {
        setIsGoalAssessmentOpen(true);
        toast({ 
          title: "Complete your profile", 
          description: "We need your goals, personality, and performance data to create your personalized 'Path to Success' plan.", 
          variant: "default" 
        });
        return;
      }

      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke("generate-goal-plan", {
        body: { 
          goalTitle: `Path to ${(profile as any).annual_goal_transactions || 40}`,
          goalDescription: `Personalized growth plan based on your current performance and personality`,
          timeframeWeeks: 52,
          budgetMin: getBudgetRange().min,
          budgetMax: getBudgetRange().max
        },
      });

      if (error) throw error;

      if (data?.plan) {
        toast({ title: "Your Path to Success is Ready!", description: "AI analyzed 1.6M+ agents to create your personalized growth plan." });
        await loadRecommendations();
      }
    } catch (error: any) {
      console.error("Error generating recommendations:", error);
      toast({ title: "AI error", description: error?.message ?? "Failed to generate recommendations", variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setIsCheckingRequirements(false);
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-48 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  const hasCompletedAssessment = Boolean((profile as any)?.onboarding_completed);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Your Personalized Recommendations
          </h2>
          <p className="text-muted-foreground">
            AI-powered recommendations based on your business goals and market data
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={generateAIRecommendations} disabled={isGenerating || isCheckingRequirements}>
            {(isGenerating || isCheckingRequirements) ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {isCheckingRequirements ? 'Checking requirements...' : isGenerating ? 'Generating your path...' : `Build My Path to ${(profile as any)?.annual_goal_transactions || 40}`}
          </Button>
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            AI Strategy Guide
          </Button>
        </div>
      </div>

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
        onComplete={async () => {
          setIsGoalAssessmentOpen(false);
          // Refresh recommendations after completing assessment
          await loadRecommendations();
          await loadServiceBundles();
        }}
      />
    </div>
  );
}
