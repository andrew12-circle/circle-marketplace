// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Target, Shield, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { BusinessHealthOverview } from "@/components/ai-dashboard/BusinessHealthOverview";
import { MarketplaceOpportunities } from "@/components/ai-dashboard/MarketplaceOpportunities";
import { AIRecommendationsDashboard } from "@/components/marketplace/AIRecommendationsDashboard";
import TopAgentInsights from "@/components/ai-dashboard/TopAgentInsights";
import { useEnhancedAI } from "@/hooks/useEnhancedAI";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AIDashboard = () => {
  const { user, profile } = useAuth();
  const [currentTime] = useState(new Date());
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { getMarketIntelligence, getBusinessOutcomeRecommendation, isLoading } = useEnhancedAI();
  const { toast } = useToast();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const generateAIInsights = async () => {
    if (!user?.id) return;
    
    setIsGeneratingInsights(true);
    try {
      // Generate comprehensive recommendations
      await supabase.functions.invoke('generate-ai-recommendations', {
        body: { agent_id: user.id }
      });

      // Get market intelligence
      await getMarketIntelligence({
        marketSegment: (profile as any)?.location || 'nationwide',
        currentPage: 'ai-dashboard'
      });

      setLastUpdate(new Date());
      toast({
        title: "AI Insights Updated",
        description: "Your business intelligence has been refreshed with the latest data."
      });
    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast({
        title: "Error",
        description: "Failed to update AI insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  useEffect(() => {
    if (user?.id && profile) {
      generateAIInsights();
    }
  }, [user?.id, profile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">AI Business Intelligence</h1>
                <p className="text-muted-foreground">Your AI-powered business protection system</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                <Shield className="h-4 w-4 mr-1" />
                Protected
              </Badge>
              <Button 
                onClick={generateAIInsights}
                disabled={isGeneratingInsights || isLoading}
                variant="outline"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isGeneratingInsights ? "Updating..." : "Refresh Insights"}
              </Button>
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {getTimeOfDayGreeting()}, {profile?.display_name || "Agent"}. Your business is protected.
                </h2>
                <p className="text-muted-foreground">
                  AI briefing for {formatDate(currentTime)} • Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : "Never"}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Market Intelligence Active
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Business Outcomes Tracked
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-8">

          {/* Business Health Overview */}
          <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <BusinessHealthOverview />
          </div>

          {/* AI Recommendations and Top Agent Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  AI-Powered Recommendations
                </h3>
                <p className="text-muted-foreground">
                  Personalized suggestions based on your goals, market data, and business patterns.
                </p>
              </div>
              <AIRecommendationsDashboard />
            </div>
            
            <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl p-6">
              <TopAgentInsights />
            </div>
          </div>

          {/* Marketplace Opportunities */}
          <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl p-6">
            <MarketplaceOpportunities />
          </div>

          {/* AI Protection Status */}
          <Card className="bg-gradient-to-br from-green-500/5 via-card/50 to-blue-500/5 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                AI Protection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-2xl font-bold text-green-600 mb-1">Active</div>
                  <div className="text-sm text-muted-foreground">Market Intelligence</div>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-600 mb-1">Active</div>
                  <div className="text-sm text-muted-foreground">Business Insights</div>
                </div>
                <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-600 mb-1">Active</div>
                  <div className="text-sm text-muted-foreground">Opportunity Detection</div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Your AI protection is fully active.</strong> The system continuously monitors market conditions, 
                  analyzes your business performance, and provides real-time recommendations to keep you ahead of the competition.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;