import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, X, MapPin, TrendingUp, Clock, BarChart, Target, Brain } from "lucide-react";
import { sbInvoke } from "@/utils/sb";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AIRecommendation {
  locationAnalysis: string;
  agentBuyingPatterns: string;
  topROIBundle: {
    name: string;
    description: string;
    services: Array<{
      name: string;
      description: string;
    }>;
    estimatedROI: string;
    timeInvestment: string;
  };
}

interface CurrentPerformance {
  dealVolume12m: string;
  dealVolume24m: string;
  buyerDeals: string;
  sellerDeals: string;
  avgBuyerPrice: string;
  avgSellerPrice: string;
  preferredLenders: string;
  preferredTitle: string;
  cashRatio: string;
  location: string;
}

interface FutureGoals {
  targetVolume: string;
  targetPricePoint: string;
  marketExpansion: string;
  partnershipGoals: string;
  timeframe: string;
  specificChallenges: string;
}

interface AskCircleAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt?: string;
}

export const AskCircleAIModal = ({ open, onOpenChange, initialPrompt }: AskCircleAIModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("contextual");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [contextualResponse, setContextualResponse] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Quick assessment state
  const [prompt, setPrompt] = useState("");
  useEffect(() => {
    if (open && initialPrompt && initialPrompt.trim()) {
      setPrompt(initialPrompt);
    }
  }, [open, initialPrompt]);
  
  // Detailed assessment state
  const [currentPerformance, setCurrentPerformance] = useState<CurrentPerformance>({
    dealVolume12m: "",
    dealVolume24m: "",
    buyerDeals: "",
    sellerDeals: "",
    avgBuyerPrice: "",
    avgSellerPrice: "",
    preferredLenders: "",
    preferredTitle: "",
    cashRatio: "",
    location: ""
  });
  
  const [futureGoals, setFutureGoals] = useState<FutureGoals>({
    targetVolume: "",
    targetPricePoint: "",
    marketExpansion: "",
    partnershipGoals: "",
    timeframe: "",
    specificChallenges: ""
  });

  const suggestionChips = [
    "How can I improve my business ROI?",
    "What services match my recent activity?", 
    "Best strategies for my current market?",
    "Analyze my saved services patterns"
  ];

  const handleContextualRecommendation = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a question",
        description: "Ask me anything about your business or the marketplace",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to get personalized recommendations",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      console.log('Getting contextual recommendation for:', prompt);
      
      const { data, error } = await sbInvoke('enhanced-ai-recommendations', {
        body: {
          message: prompt.trim(),
          userId: user.id,
          context: {
            currentPage: "ai_modal",
            timestamp: new Date().toISOString(),
            previousQuestion: prompt
          }
        }
      });

      console.log('Enhanced AI response:', { data, error });

      if (error) {
        console.error('Error getting contextual recommendation:', error);
        // Fallback to original service
        console.log('Falling back to original AI service');
        const fallbackData = await sbInvoke('ask-circle-ai', {
          body: { 
            type: 'quick',
            prompt: prompt.trim() 
          },
        });
        
        if (fallbackData.error) {
          throw new Error('Both AI services failed');
        }
        setRecommendation(fallbackData.data.recommendation);
        toast({
          title: "Using Standard AI",
          description: "Enhanced AI temporarily unavailable, using standard recommendations",
          variant: "default",
        });
      } else if (data?.recommendation) {
        setContextualResponse(data.recommendation);
      } else {
        throw new Error('No recommendation received from AI service');
      }
    } catch (error) {
      console.error('All AI services failed:', error);
      toast({
        title: "AI Service Error",
        description: "Unable to get AI recommendation. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRecommendation = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a question",
        description: "Tell us about your location or marketing needs",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await sbInvoke('ask-circle-ai', {
        body: { 
          type: 'quick',
          prompt: prompt.trim() 
        },
      });

      if (error) throw error;

      setRecommendation(data.recommendation);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI recommendation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDetailedAssessment = async () => {
    // Validate required fields
    if (!currentPerformance.location || !futureGoals.targetVolume) {
      toast({
        title: "Please complete required fields",
        description: "Location and target volume are required for assessment",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await sbInvoke('ask-circle-ai', {
        body: { 
          type: 'detailed',
          currentPerformance,
          futureGoals
        },
      });

      if (error) throw error;

      setRecommendation(data.recommendation);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI recommendation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chipText: string) => {
    setPrompt(chipText);
  };

  const handleReset = () => {
    setRecommendation(null);
    setContextualResponse(null);
    setPrompt("");
    setCurrentPerformance({
      dealVolume12m: "",
      dealVolume24m: "",
      buyerDeals: "",
      sellerDeals: "",
      avgBuyerPrice: "",
      avgSellerPrice: "",
      preferredLenders: "",
      preferredTitle: "",
      cashRatio: "",
      location: ""
    });
    setFutureGoals({
      targetVolume: "",
      targetPricePoint: "",
      marketExpansion: "",
      partnershipGoals: "",
      timeframe: "",
      specificChallenges: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold">Ask Circle AI</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Get data-driven marketing recommendations for your area.
          </DialogDescription>
        </DialogHeader>

        {!recommendation && !contextualResponse ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="contextual" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Context-Aware
              </TabsTrigger>
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Quick Assessment
              </TabsTrigger>
              <TabsTrigger value="detailed" className="flex items-center gap-2">
                <BarChart className="w-4 h-4" />
                Detailed Assessment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contextual" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">AI-Powered Context Analysis</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    Get personalized recommendations based on your profile, saved services, recent activity, and market trends.
                  </p>
                </div>
                
                <Input
                  placeholder="How can I improve my business based on my current activity?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="h-12 text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleContextualRecommendation()}
                />
                
                <div className="flex flex-wrap gap-2">
                  {suggestionChips.map((chip) => (
                    <Button
                      key={chip}
                      variant="outline"
                      size="sm"
                      onClick={() => handleChipClick(chip)}
                      className="text-xs"
                    >
                      {chip}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleContextualRecommendation}
                disabled={loading || !prompt.trim()}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
              >
                {loading ? "Analyzing Your Data..." : "Get Context-Aware Recommendation"}
              </Button>
            </TabsContent>

            <TabsContent value="quick" className="space-y-6 mt-6">
              <div className="space-y-4">
                <Input
                  placeholder="Best bundle for Franklin, TN"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="h-12 text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleQuickRecommendation()}
                />
                
                <div className="flex flex-wrap gap-2">
                  {suggestionChips.map((chip) => (
                    <Button
                      key={chip}
                      variant="outline"
                      size="sm"
                      onClick={() => handleChipClick(chip)}
                      className="text-xs"
                    >
                      {chip}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleQuickRecommendation}
                disabled={loading || !prompt.trim()}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {loading ? "Getting Recommendation..." : "Get Quick Recommendation"}
              </Button>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-6 mt-6">
              <div className="space-y-6">
                {/* Current Performance Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Where You Are At</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        placeholder="Franklin, TN"
                        value={currentPerformance.location}
                        onChange={(e) => setCurrentPerformance({...currentPerformance, location: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dealVolume12m">Deals (Last 12 months)</Label>
                      <Input
                        id="dealVolume12m"
                        placeholder="25"
                        value={currentPerformance.dealVolume12m}
                        onChange={(e) => setCurrentPerformance({...currentPerformance, dealVolume12m: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyerDeals">Buyer Deals (%)</Label>
                      <Input
                        id="buyerDeals"
                        placeholder="60%"
                        value={currentPerformance.buyerDeals}
                        onChange={(e) => setCurrentPerformance({...currentPerformance, buyerDeals: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sellerDeals">Seller Deals (%)</Label>
                      <Input
                        id="sellerDeals"
                        placeholder="40%"
                        value={currentPerformance.sellerDeals}
                        onChange={(e) => setCurrentPerformance({...currentPerformance, sellerDeals: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avgBuyerPrice">Avg Buyer Price</Label>
                      <Input
                        id="avgBuyerPrice"
                        placeholder="$450,000"
                        value={currentPerformance.avgBuyerPrice}
                        onChange={(e) => setCurrentPerformance({...currentPerformance, avgBuyerPrice: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avgSellerPrice">Avg Seller Price</Label>
                      <Input
                        id="avgSellerPrice"
                        placeholder="$480,000"
                        value={currentPerformance.avgSellerPrice}
                        onChange={(e) => setCurrentPerformance({...currentPerformance, avgSellerPrice: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferredLenders">Preferred Lenders</Label>
                      <Input
                        id="preferredLenders"
                        placeholder="First Horizon, Fairway Independent"
                        value={currentPerformance.preferredLenders}
                        onChange={(e) => setCurrentPerformance({...currentPerformance, preferredLenders: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cashRatio">Cash vs Financing Ratio</Label>
                      <Input
                        id="cashRatio"
                        placeholder="20% cash, 80% financed"
                        value={currentPerformance.cashRatio}
                        onChange={(e) => setCurrentPerformance({...currentPerformance, cashRatio: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Future Goals Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Where You're Going</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetVolume">Target Deal Volume *</Label>
                      <Input
                        id="targetVolume"
                        placeholder="50 deals/year"
                        value={futureGoals.targetVolume}
                        onChange={(e) => setFutureGoals({...futureGoals, targetVolume: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeframe">Timeframe</Label>
                      <Select value={futureGoals.timeframe} onValueChange={(value) => setFutureGoals({...futureGoals, timeframe: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6months">6 months</SelectItem>
                          <SelectItem value="12months">12 months</SelectItem>
                          <SelectItem value="18months">18 months</SelectItem>
                          <SelectItem value="24months">24 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetPricePoint">Target Price Points</Label>
                      <Input
                        id="targetPricePoint"
                        placeholder="$500K - $750K"
                        value={futureGoals.targetPricePoint}
                        onChange={(e) => setFutureGoals({...futureGoals, targetPricePoint: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marketExpansion">Market Expansion</Label>
                      <Input
                        id="marketExpansion"
                        placeholder="Brentwood, Cool Springs"
                        value={futureGoals.marketExpansion}
                        onChange={(e) => setFutureGoals({...futureGoals, marketExpansion: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="partnershipGoals">Partnership Goals</Label>
                      <Input
                        id="partnershipGoals"
                        placeholder="Exclusive lender relationships, builder partnerships"
                        value={futureGoals.partnershipGoals}
                        onChange={(e) => setFutureGoals({...futureGoals, partnershipGoals: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specificChallenges">Specific Challenges</Label>
                      <Textarea
                        id="specificChallenges"
                        placeholder="Lead generation, competing with teams, time management..."
                        value={futureGoals.specificChallenges}
                        onChange={(e) => setFutureGoals({...futureGoals, specificChallenges: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleDetailedAssessment}
                  disabled={loading || !currentPerformance.location || !futureGoals.targetVolume}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {loading ? "Analyzing Your Profile..." : "Get Detailed Recommendation"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : contextualResponse ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Context-Aware AI Analysis</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Personalized Recommendation</h4>
                  <p className="text-sm text-blue-700">Based on your profile, activity, and current market data</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                {contextualResponse}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="flex-1"
              >
                Ask Another Question
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={() => {
                  onOpenChange(false);
                  // Trigger marketplace to show recommended services
                  const event = new CustomEvent('showContextualRecommendations');
                  window.dispatchEvent(event);
                }}
              >
                Apply Recommendations
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                AI Recommendation{activeTab === 'quick' && prompt ? ` for ${prompt}` : ''}
              </h3>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Location Analysis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium">Location Analysis:</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {recommendation.locationAnalysis}
                </p>
              </div>

              {/* Agent Buying Patterns */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <h4 className="font-medium">Agent Buying Patterns:</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {recommendation.agentBuyingPatterns}
                </p>
              </div>

              {/* Top ROI Bundle */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Top ROI Bundle Recommendation:</h4>
                </div>
                
                <p className="text-sm font-medium text-blue-800">
                  {recommendation.topROIBundle.description}
                </p>

                <div className="space-y-2">
                  {recommendation.topROIBundle.services.map((service, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-sm">{service.name}:</span>
                        <span className="text-sm text-muted-foreground ml-1">{service.description}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-blue-200">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">Estimated ROI:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {recommendation.topROIBundle.estimatedROI}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Estimated Time Investment: {recommendation.topROIBundle.timeInvestment}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="flex-1"
              >
                Ask Another Question
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  onOpenChange(false);
                  // Trigger marketplace filter/scroll to recommended services
                  const event = new CustomEvent('showRecommendedServices');
                  window.dispatchEvent(event);
                }}
              >
                View Services
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};