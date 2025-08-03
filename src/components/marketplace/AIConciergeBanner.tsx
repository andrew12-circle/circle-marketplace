import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Target, ArrowRight, Lightbulb, Users, MessageCircle, Mic, Send, Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AskCircleAIModal } from "./AskCircleAIModal";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface BusinessInsight {
  type: 'performance' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  actionText: string;
  impact: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export const AIConciergeBanner = () => {
  const { user, profile } = useAuth();
  const [currentInsight, setCurrentInsight] = useState<BusinessInsight | null>(null);
  const [currentTime] = useState(new Date());
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [placeholderText, setPlaceholderText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [isRecommendationExpanded, setIsRecommendationExpanded] = useState(false);
  const { toast } = useToast();

  const placeholderQuestions = [
    "How can I help you today?",
    "Anything particular you're looking for?", 
    "What business goals are you working on?",
    "Need help finding the right services?",
    "How can I boost your sales this month?"
  ];

  // Mock insights based on agent performance data
  const businessInsights: BusinessInsight[] = [
    {
      type: 'performance',
      title: 'Agents closing 10+ deals annually use 3x more digital marketing',
      description: 'Your current close rate suggests you could benefit from proven digital strategies used by top performers.',
      actionText: 'Explore Digital Marketing',
      impact: '↗ 40% more leads',
      category: 'Marketing',
      priority: 'high'
    },
    {
      type: 'opportunity', 
      title: 'Social media posting increases referrals by 65%',
      description: 'Agents with consistent social presence generate more repeat business and referrals.',
      actionText: 'View Social Media Services',
      impact: '↗ 65% more referrals',
      category: 'Social Media',
      priority: 'medium'
    },
    {
      type: 'recommendation',
      title: 'Professional photography boosts listing views by 118%',
      description: 'High-quality photos are the #1 factor in attracting more showings and faster sales.',
      actionText: 'Find Photography Services',
      impact: '↗ 118% more views',
      category: 'Photography',
      priority: 'high'
    },
    {
      type: 'opportunity',
      title: 'Direct mail campaigns in your area show 8.5% response rates',
      description: 'Local market data shows direct mail performing exceptionally well in your zip code.',
      actionText: 'Browse Direct Mail Options',
      impact: '↗ 8.5% response rate',
      category: 'Direct Mail',
      priority: 'medium'
    }
  ];

  // Get context-aware AI recommendation on component mount
  useEffect(() => {
    if (user && profile) {
      getContextualRecommendation();
    } else {
      // Show generic demo recommendation for non-authenticated users
      setAiRecommendation("🚀 Based on market data, real estate agents using professional photography see 118% more listing views and close deals 23% faster. Our AI can help you find the perfect services to boost your business!");
    }
  }, [user, profile]);

  const getContextualRecommendation = async () => {
    try {
      setIsLoadingRecommendation(true);
      
      console.log('Requesting contextual AI recommendation for user:', user?.id);
      
      const { data, error } = await supabase.functions.invoke('enhanced-ai-recommendations', {
        body: {
          message: "Provide a personalized business recommendation based on my profile and current market trends",
          userId: user?.id,
          context: {
            currentPage: "marketplace",
            timestamp: new Date().toISOString()
          }
        }
      });

      console.log('AI recommendation response:', { data, error });

      if (error) {
        console.error('Error getting AI recommendation:', error);
        toast({
          title: "AI Analysis Unavailable", 
          description: "Using general insights for now. Please try again later.",
          variant: "destructive"
        });
        // Fall back to static insights
        const randomInsight = businessInsights[Math.floor(Math.random() * businessInsights.length)];
        setCurrentInsight(randomInsight);
      } else if (data?.recommendation) {
        setAiRecommendation(data.recommendation);
        console.log('Context-aware recommendation received:', data);
      } else {
        console.warn('No recommendation received from AI service');
        // Fall back to static insights
        const randomInsight = businessInsights[Math.floor(Math.random() * businessInsights.length)];
        setCurrentInsight(randomInsight);
      }
    } catch (error) {
      console.error('Failed to get contextual recommendation:', error);
      toast({
        title: "Connection Error",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
      // Fall back to static insights
      const randomInsight = businessInsights[Math.floor(Math.random() * businessInsights.length)];
      setCurrentInsight(randomInsight);
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  // Animated placeholder text effect
  useEffect(() => {
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
          setTimeout(typeEffect, 500); // Pause before typing next question
          return;
        }
      } else {
        setPlaceholderText(currentQuestion.substring(0, currentCharIndex + 1));
        currentCharIndex++;
        
        if (currentCharIndex === currentQuestion.length) {
          setTimeout(() => {
            isDeleting = true;
            typeEffect();
          }, 2000); // Pause when finished typing
          return;
        }
      }
      
      setTimeout(typeEffect, isDeleting ? 50 : 100);
    };
    
    typeEffect();
  }, []);


  const handleSendMessage = () => {
    if (chatInput.trim()) {
      // Open the AI modal with the user's message
      setIsAIModalOpen(true);
      setChatInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'medium': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return TrendingUp;
      case 'opportunity': return Target;
      default: return Lightbulb;
    }
  };

  // Show for all users with different content

  return (
    <div className="mb-8">
      <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg md:text-xl font-semibold text-foreground">
                  {getTimeOfDayGreeting()}, {user && profile ? (profile.display_name || 'Agent') : 'Future Circle Member'}! 
                </h3>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                  AI Concierge
                </Badge>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm md:text-base text-muted-foreground">
                  How can I help you grow your business today?
                </p>
              </div>

              {/* Chat Input Area */}
              <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={placeholderText}
                      className="bg-background/50 border-border/50 placeholder:text-muted-foreground/70 focus:bg-background"
                    />
                  </div>
                  <Button 
                    onClick={() => setIsAIModalOpen(true)}
                    size="sm" 
                    variant="outline"
                    className="bg-background/50 hover:bg-background border-border/50"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleSendMessage}
                    size="sm" 
                    className="bg-primary hover:bg-primary/90"
                    disabled={!chatInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Context-Aware AI Recommendation or Static Insight */}
              {(aiRecommendation || currentInsight) && (
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 mb-4">
                  {isLoadingRecommendation ? (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-4 bg-muted animate-pulse rounded w-48"></div>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            AI Analysis
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted animate-pulse rounded w-full"></div>
                          <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ) : !isRecommendationExpanded ? (
                    <Button
                      variant="ghost"
                      onClick={() => setIsRecommendationExpanded(true)}
                      className="w-full justify-start p-0 h-auto"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {aiRecommendation ? (
                            <Sparkles className="h-4 w-4 text-primary" />
                          ) : (
                            (() => {
                              const IconComponent = getTypeIcon(currentInsight!.type);
                              return <IconComponent className="h-4 w-4 text-primary" />;
                            })()
                          )}
                        </div>
                        
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">
                              {aiRecommendation ? "AI-Powered Business Insight" : currentInsight!.title}
                            </h4>
                            <Badge variant="outline" className={
                              aiRecommendation 
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                                : getPriorityColor(currentInsight!.priority)
                            }>
                              {aiRecommendation ? "Personalized" : `${currentInsight!.priority} priority`}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Click to view personalized recommendation
                          </p>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Button>
                  ) : aiRecommendation ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                          <h4 className="font-semibold text-foreground">AI-Powered Business Insight</h4>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                            Personalized
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsRecommendationExpanded(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="text-sm text-muted-foreground whitespace-pre-line">
                        {aiRecommendation}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 border-blue-500/20">
                            <Brain className="h-3 w-3 mr-1" />
                            Context-Aware
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={getContextualRecommendation}
                            className="text-xs"
                          >
                            Refresh Analysis
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : currentInsight && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {(() => {
                              const IconComponent = getTypeIcon(currentInsight.type);
                              return <IconComponent className="h-4 w-4 text-primary" />;
                            })()}
                          </div>
                          <h4 className="font-semibold text-foreground">{currentInsight.title}</h4>
                          <Badge className={getPriorityColor(currentInsight.priority)} variant="outline">
                            {currentInsight.priority} priority
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsRecommendationExpanded(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {currentInsight.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
                            {currentInsight.impact}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Category: {currentInsight.category}
                          </span>
                        </div>
                        
                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                          {currentInsight.actionText}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Based on analysis of 10,000+ successful real estate professionals</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AskCircleAIModal 
        open={isAIModalOpen} 
        onOpenChange={setIsAIModalOpen} 
      />
    </div>
  );
};