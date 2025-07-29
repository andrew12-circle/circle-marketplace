import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, MapPin, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface AskCircleAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AskCircleAIModal = ({ open, onOpenChange }: AskCircleAIModalProps) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const { toast } = useToast();

  const suggestionChips = [
    "Analyze my location for ROI",
    "Best bundle for Franklin, TN", 
    "Top 3 marketing items"
  ];

  const handleGetRecommendation = async () => {
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
      
      const { data, error } = await supabase.functions.invoke('ask-circle-ai', {
        body: { prompt: prompt.trim() },
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
    setPrompt("");
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
          <p className="text-sm text-muted-foreground">
            Get data-driven marketing recommendations for your area.
          </p>
        </DialogHeader>

        {!recommendation ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <Input
                placeholder="Best bundle for Franklin, TN"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-12 text-base"
                onKeyPress={(e) => e.key === 'Enter' && handleGetRecommendation()}
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
              onClick={handleGetRecommendation}
              disabled={loading || !prompt.trim()}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {loading ? "Getting Recommendation..." : "Get Recommendation"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI Recommendation for {prompt}</h3>
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
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                View Services
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};