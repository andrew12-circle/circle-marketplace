
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle, BookOpen, Bot } from "lucide-react";

interface RecommendationsHeaderProps {
  personalityType?: string;
  currentTransactions: number;
  targetTransactions: number;
  isGenerating: boolean;
  hasCompleteProfile: boolean;
  onGenerateRecommendations: () => void;
  onOpenAssessment: () => void;
}

export function RecommendationsHeader({
  personalityType,
  currentTransactions,
  targetTransactions,
  isGenerating,
  hasCompleteProfile,
  onGenerateRecommendations,
  onOpenAssessment
}: RecommendationsHeaderProps) {
  return (
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

      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={hasCompleteProfile ? onGenerateRecommendations : onOpenAssessment} 
          disabled={isGenerating}
          data-tour="generate-recommendations-button"
        >
          {isGenerating ? (
            <>
              <Bot className="h-4 w-4 mr-2 animate-pulse" />
              Building Your Path...
            </>
          ) : hasCompleteProfile ? (
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
  );
}
