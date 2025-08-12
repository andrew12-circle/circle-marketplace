
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, Send, Sparkles, ShoppingCart, TrendingUp, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AskCircleAIModal } from "./AskCircleAIModal";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { GoalAssessmentModal } from "./GoalAssessmentModal";
import { AIRecommendationsDashboard } from "./AIRecommendationsDashboard";
import { useEnhancedAI } from "@/hooks/useEnhancedAI";

export const AIConciergeBanner = () => {
  const { user, profile } = useAuth();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isGoalAssessmentOpen, setIsGoalAssessmentOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [placeholderText, setPlaceholderText] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showRecommendationsDashboard, setShowRecommendationsDashboard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getRecommendation, isLoading } = useEnhancedAI();
  
  const placeholderQuestions = [
    "I need a closing gift for a $400K first-time buyer couple, under $100",
    "What marketing services give the best ROI in my area?", 
    "Show me vendors who offer co-pay in Nashville",
    "I want to increase my transaction volume by 30% this year"
  ];

  // Check if user needs goal assessment or show recommendations dashboard
  useEffect(() => {
    if (user && profile) {
      const profileWithGoals = profile as any;

      // Check if user needs goal assessment
      if (!profileWithGoals.onboarding_completed) {
        setIsGoalAssessmentOpen(true);
        setShowRecommendationsDashboard(false);
      } else if (profileWithGoals.onboarding_completed && !showRecommendationsDashboard) {
        setShowRecommendationsDashboard(true);
        generateRecommendations();
      }
    }
  }, [user, profile]);
  const generateRecommendations = async () => {
    if (!user?.id || !(profile as any)?.onboarding_completed) return;
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-ai-recommendations', {
        body: {
          agent_id: user.id
        }
      });
      if (error) throw error;
      if (data?.success) {
        console.log(`Generated ${data.recommendations_count} recommendations`);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  // Animated placeholder text effect
  useEffect(() => {
    if (isInputFocused || chatInput.trim().length > 0) {
      setPlaceholderText("");
      return;
    }
    let currentQuestionIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    const typeEffect = () => {
      const currentQuestion = placeholderQuestions[currentQuestionIndex];
      if (isDeleting) {
        setPlaceholderText(currentQuestion.substring(0, currentCharIndex - 1));
        currentCharIndex--;
        if (currentCharIndex === 0) {
          isDeleting = false;
          currentQuestionIndex = (currentQuestionIndex + 1) % placeholderQuestions.length;
          setTimeout(typeEffect, 1000);
          return;
        }
      } else {
        setPlaceholderText(currentQuestion.substring(0, currentCharIndex + 1));
        currentCharIndex++;
        if (currentCharIndex === currentQuestion.length) {
          setTimeout(() => {
            isDeleting = true;
            typeEffect();
          }, 3000);
          return;
        }
      }
      setTimeout(typeEffect, isDeleting ? 150 : 200);
    };
    const timeout = setTimeout(typeEffect, 1000);
    return () => clearTimeout(timeout);
  }, [isInputFocused, chatInput]);
  const handleSendMessage = async () => {
    const query = chatInput.trim();
    if (!query) return;
    
    if (!user || !profile) {
      navigate("/pricing");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Parse query intent to determine if it needs AI processing or direct search
      const intent = parseQueryIntent(query);
      
      if (intent.requiresAI) {
        // Use AI Concierge for complex queries
        const result = await processAIQuery(query, intent);
        setAiResults(result);
      } else {
        // Direct marketplace search for simple queries
        navigate(`/?q=${encodeURIComponent(query)}`);
      }
    } finally {
      setIsProcessing(false);
      setChatInput("");
    }
  };

  const parseQueryIntent = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    // Business outcome queries require AI processing
    const businessOutcomeKeywords = ['roi', 'increase', 'boost', 'grow', 'revenue', 'transactions', 'leads', 'referrals'];
    const contextualKeywords = ['best', 'recommend', 'should i', 'help me', 'strategy', 'plan'];
    const specificConstraints = ['under $', 'in my area', 'my market', 'co-pay', 'marketing budget'];
    
    const requiresAI = businessOutcomeKeywords.some(keyword => lowerQuery.includes(keyword)) ||
                      contextualKeywords.some(keyword => lowerQuery.includes(keyword)) ||
                      specificConstraints.some(keyword => lowerQuery.includes(keyword));
    
    const type = lowerQuery.includes('gift') ? 'product_search' :
                lowerQuery.includes('marketing') ? 'marketing_strategy' :
                lowerQuery.includes('co-pay') ? 'copay_opportunity' :
                lowerQuery.includes('vendor') ? 'vendor_search' : 'general_advice';
    
    return { requiresAI, type, originalQuery: query };
  };

  const processAIQuery = async (query: string, intent: any) => {
    try {
      const context = {
        currentPage: 'ai_concierge',
        searchQuery: query,
        intentType: intent.type,
        timestamp: new Date().toISOString()
      };

      const recommendation = await getRecommendation(query, context);
      
      if (recommendation) {
        // Log the successful AI interaction for learning
        await logAIInteraction(query, recommendation, intent.type);
        
        toast({
          title: "AI Concierge Results",
          description: "Found personalized recommendations based on your business goals.",
        });
        
        return {
          recommendation,
          intent: intent.type,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error processing AI query:', error);
      toast({
        title: "Processing Error", 
        description: "Let me search the marketplace for you instead.",
        variant: "destructive"
      });
      navigate(`/?q=${encodeURIComponent(query)}`);
    }
    return null;
  };

  const logAIInteraction = async (query: string, recommendation: string, intentType: string) => {
    try {
      await supabase.functions.invoke('log-ai-interaction', {
        body: {
          userId: user?.id,
          query,
          recommendation,
          intentType,
          resultType: 'concierge_response',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error logging AI interaction:', error);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
  return <div className="mb-8 space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 shadow-lg">
        <CardContent className="p-4 md:p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">
                    {getTimeOfDayGreeting()}, {user && profile ? profile.display_name || 'Agent' : 'Future Member'}!
                  </h3>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Concierge
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {showRecommendationsDashboard ? "Here are your personalized business recommendations" : "How can I help you grow your business today?"}
                </p>
              </div>
            </div>

            {/* AI Concierge Input */}
            {!showRecommendationsDashboard && (
              <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Input 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      onKeyPress={handleKeyPress} 
                      onFocus={() => setIsInputFocused(true)} 
                      onBlur={() => setIsInputFocused(false)} 
                      placeholder={placeholderText} 
                      className="bg-background/50 border-border/50 focus:bg-background" 
                      disabled={isProcessing || isLoading}
                    />
                    {(isProcessing || isLoading) && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={handleSendMessage} 
                    size="sm" 
                    disabled={!chatInput.trim() || isProcessing || isLoading}
                  >
                    {isProcessing ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* AI Results Display */}
            {aiResults && (
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-2">AI Concierge Results</h4>
                    <p className="text-sm text-muted-foreground mb-3">{aiResults.recommendation}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/?q=${encodeURIComponent(aiResults.recommendation)}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Services
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setAiResults(null)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show AI Recommendations Dashboard or Goal Setup */}
            {showRecommendationsDashboard && (profile as any)?.onboarding_completed && <AIRecommendationsDashboard />}

            {/* Call to Action for Non-Authenticated Users */}
            {!user && <div className="text-center">
                <div className="flex flex-wrap items-center justify-center gap-3 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Get personalized recommendations based on your goals & data from 300,000 successful agents</span>
                  <Button onClick={() => navigate("/pricing")} size="sm" className="bg-primary hover:bg-primary/90">
                    Create Free Account
                  </Button>
                </div>
              </div>}
          </div>
        </CardContent>
      </Card>
      
      <AskCircleAIModal open={isAIModalOpen} onOpenChange={setIsAIModalOpen} initialPrompt={chatInput} />
      
      <GoalAssessmentModal open={isGoalAssessmentOpen} onOpenChange={setIsGoalAssessmentOpen} onComplete={() => {
      setShowRecommendationsDashboard(true);
      generateRecommendations();
    }} />
    </div>;
};
