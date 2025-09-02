import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, Send, Mic, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AskCircleAIModal } from "./AskCircleAIModal";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { GoalAssessmentModal } from "./GoalAssessmentModal";
import { AIRecommendationsDashboard } from "./AIRecommendationsDashboard";

export const AIConciergeBanner = () => {
  const { user, profile } = useAuth();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isGoalAssessmentOpen, setIsGoalAssessmentOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [placeholderText, setPlaceholderText] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showRecommendationsDashboard, setShowRecommendationsDashboard] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const placeholderQuestions = [
    "How can I help you today?",
    "What business goals are you working on?",
    "Need help finding the right services?",
    "How can I boost your sales this month?"
  ];

  // Check if user needs goal assessment or show recommendations dashboard
  useEffect(() => {
    if (user && profile) {
      const profileWithGoals = profile as any;
      
      // Check if user needs goal assessment
      if (!profileWithGoals.goal_assessment_completed) {
        setIsGoalAssessmentOpen(true);
        setShowRecommendationsDashboard(false);
      } else if (profileWithGoals.goal_assessment_completed && !showRecommendationsDashboard) {
        setShowRecommendationsDashboard(true);
        generateRecommendations();
      }
    }
  }, [user, profile]);

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

  const generateRecommendations = async () => {
    if (!user?.id || !(profile as any)?.goal_assessment_completed) return;

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-recommendations', {
        body: { agent_id: user.id }
      });

      if (error) throw error;

      if (data?.success) {
        console.log(`Generated ${data.recommendations_count} recommendations`);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  const handleSendMessage = () => {
    const query = chatInput.trim();
    if (!query) return;

    if (!user || !profile) {
      toast({
        title: "Create a free account",
        description: "Sign in to get personalized, location-aware recommendations.",
      });
      navigate("/auth");
      return;
    }

    // Deep-link into marketplace search with the typed query
    navigate(`/marketplace?q=${encodeURIComponent(query)}`);
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

  return (
    <div className="mb-8 space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">
                    {getTimeOfDayGreeting()}, {user && profile ? (profile.display_name || 'Agent') : 'Future Circle Member'}!
                  </h3>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Concierge
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {showRecommendationsDashboard 
                    ? "Here are your personalized business recommendations"
                    : "How can I help you grow your business today?"
                  }
                </p>
              </div>
            </div>

            {/* Chat Input */}
            {!showRecommendationsDashboard && (
              <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      placeholder={placeholderText}
                      className="bg-background/50 border-border/50 focus:bg-background"
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      if (!user || !profile) {
                        toast({
                          title: "Create a free account",
                          description: "Sign in to talk to Circle AI.",
                        });
                        navigate("/auth");
                        return;
                      }
                      setIsAIModalOpen(true);
                    }}
                    size="sm" 
                    variant="outline"
                    className="bg-background/50 hover:bg-background"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleSendMessage}
                    size="sm" 
                    disabled={!chatInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Show AI Recommendations Dashboard or Goal Setup */}
            {showRecommendationsDashboard && (profile as any)?.goal_assessment_completed && (
              <AIRecommendationsDashboard />
            )}

            {/* Call to Action for Non-Authenticated Users */}
            {!user && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Get personalized recommendations based on your goals</span>
                </div>
                <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
                  Create Free Account
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <AskCircleAIModal 
        open={isAIModalOpen} 
        onOpenChange={setIsAIModalOpen} 
        initialPrompt={chatInput}
      />
      
      <GoalAssessmentModal
        open={isGoalAssessmentOpen}
        onOpenChange={setIsGoalAssessmentOpen}
        onComplete={() => {
          setShowRecommendationsDashboard(true);
          generateRecommendations();
        }}
      />
    </div>
  );
};