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

  const generateAIRecommendations = async () => {
    if (!user?.id) return;
    try {
      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke('generate-ai-recommendations', {
        body: { agent_id: user.id },
      });

      if (error) {
        console.error('Error invoking generate-ai-recommendations:', error);
        toast({
          title: "Generation failed",
          description: "We couldn't generate recommendations right now. Please try again shortly.",
          variant: "destructive",
        });
        return;
      }

      if (data?.requires_assessment) {
        toast({
          title: "Assessment required",
          description: "Please complete your goal assessment to get personalized recommendations.",
          variant: "destructive",
        });
        setIsGoalAssessmentOpen(true);
        return;
      }

      await loadRecommendations();

      const count = data?.recommendations_count ?? undefined;
      toast({
        title: "Recommendations updated",
        description: count !== undefined
          ? `Generated ${count} new recommendation${count === 1 ? '' : 's'}.`
          : "Your personalized recommendations are ready.",
      });
    } catch (e) {
      console.error('Unexpected error generating recommendations:', e);
      toast({
        title: "Something went wrong",
        description: "Please try generating recommendations again.",
        variant: "destructive",
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
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Personalized Recommendations</h2>
          <p className="text-muted-foreground">
            Based on your goals and market analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BuildAIPlanButton />
          <Button variant="outline" size="sm" onClick={() => setIsGoalAssessmentOpen(true)}>
            Edit Goals
          </Button>
        </div>
      </div>

      {/* Goal Progress and Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Goal Progress */}
        {(profile as any)?.annual_goal_transactions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Annual Transactions</span>
                    <span>0 / {(profile as any).annual_goal_transactions}</span>
                  </div>
                  <Progress value={0} className="h-2 mt-1" />
                </div>
                
                {(profile as any).annual_goal_volume && (
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Annual Volume</span>
                      <span>$0 / ${(profile as any).annual_goal_volume.toLocaleString()}</span>
                    </div>
                    <Progress value={0} className="h-2 mt-1" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {recommendations.length === 0 && bundles.length === 0 && (
          <Card>
            <CardContent className="text-center py-6 space-y-3">
              <h3 className="font-semibold">
                {hasCompletedAssessment ? "Ready for your first recommendations" : "No Recommendations Yet"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {hasCompletedAssessment
                  ? "Generate personalized suggestions based on your saved goals."
                  : "Complete your goal assessment to get personalized recommendations."}
              </p>
              <div className="flex flex-col gap-2 pt-2">
                {hasCompletedAssessment ? (
                  <>
                    <Button onClick={generateAIRecommendations} disabled={isGenerating} className="w-full">
                      {isGenerating ? "Generating..." : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Generate Recommendations
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={async () => { await buildPlan(); }} disabled={isBuilding} className="w-full">
                      {isBuilding ? "Contacting OpenAI..." : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          AI Strategy Guide
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsGoalAssessmentOpen(true)} className="w-full">
                    Complete Assessment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              AI Recommendations
            </CardTitle>
            <CardDescription>
              Personalized suggestions based on your profile and goals
            </CardDescription>
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
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Curated Service Bundles
            </CardTitle>
            <CardDescription>
              Optimized packages for your business goals
            </CardDescription>
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
          await generateAIRecommendations();
          setIsGoalAssessmentOpen(false);
        }}
      />
    </div>
  );
}
