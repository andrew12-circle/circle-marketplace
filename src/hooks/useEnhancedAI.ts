import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UseEnhancedAIProps {
  onSuccess?: (recommendation: string) => void;
  onError?: (error: string) => void;
}

interface AIRecommendationContext {
  currentPage?: string;
  filters?: any;
  searchQuery?: string;
  selectedServices?: string[];
  marketSegment?: string;
}

export const useEnhancedAI = ({ onSuccess, onError }: UseEnhancedAIProps = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastRecommendation, setLastRecommendation] = useState<string | null>(null);

  const getRecommendation = async (
    message: string, 
    context?: AIRecommendationContext
  ): Promise<string | null> => {
    if (!user?.id) {
      const errorMsg = "Please log in to get personalized recommendations";
      onError?.(errorMsg);
      toast({
        title: "Authentication Required",
        description: errorMsg,
        variant: "destructive"
      });
      return null;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('enhanced-ai-recommendations', {
        body: {
          message,
          userId: user.id,
          context: {
            timestamp: new Date().toISOString(),
            ...context
          }
        }
      });

      if (error) {
        console.error('Enhanced AI recommendation error:', error);
        const errorMsg = "Failed to get AI recommendation. Please try again.";
        onError?.(errorMsg);
        toast({
          title: "AI Service Error",
          description: errorMsg,
          variant: "destructive"
        });
        return null;
      }

      if (data?.recommendation) {
        setLastRecommendation(data.recommendation);
        onSuccess?.(data.recommendation);
        return data.recommendation;
      }

      return null;
    } catch (error) {
      console.error('Failed to get enhanced AI recommendation:', error);
      const errorMsg = "Network error. Please check your connection and try again.";
      onError?.(errorMsg);
      toast({
        title: "Connection Error",
        description: errorMsg,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickInsight = async (topic: string, context?: AIRecommendationContext) => {
    return getRecommendation(
      `Provide a quick business insight about ${topic} based on my profile and current market data.`,
      { ...context, currentPage: 'quick_insight' }
    );
  };

  const analyzeUserBehavior = async (context?: AIRecommendationContext) => {
    return getRecommendation(
      "Analyze my recent activity and saved services to provide personalized business recommendations.",
      { ...context, currentPage: 'behavior_analysis' }
    );
  };

  const getMarketOpportunities = async (context?: AIRecommendationContext) => {
    return getRecommendation(
      "What are the best market opportunities for my business based on current trends and my profile?",
      { ...context, currentPage: 'market_opportunities' }
    );
  };

  const getServiceRecommendations = async (category?: string, context?: AIRecommendationContext) => {
    const message = category 
      ? `Recommend the best ${category} services based on my profile and recent activity.`
      : "What services would you recommend based on my profile and recent activity?";
      
    return getRecommendation(message, { ...context, currentPage: 'service_recommendations' });
  };

  const analyzeROI = async (serviceType: string, context?: AIRecommendationContext) => {
    return getRecommendation(
      `Analyze the potential ROI for ${serviceType} services based on my business profile and market data.`,
      { ...context, currentPage: 'roi_analysis' }
    );
  };

  return {
    isLoading,
    lastRecommendation,
    getRecommendation,
    getQuickInsight,
    analyzeUserBehavior,
    getMarketOpportunities,
    getServiceRecommendations,
    analyzeROI,
  };
};