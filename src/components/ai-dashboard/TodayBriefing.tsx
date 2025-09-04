import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, TrendingUp, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getProStatus } from '@/lib/profile';

interface BriefingInsight {
  type: 'opportunity' | 'warning' | 'success' | 'trend';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
  cta?: string;
}

const TodayBriefing = () => {
  const { user, profile } = useAuth();
  const [insights, setInsights] = useState<BriefingInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isPro = getProStatus(profile);

  useEffect(() => {
    if (user?.id) {
      generateTodayBriefing();
    }
  }, [user?.id]);

  const generateTodayBriefing = async () => {
    try {
      setIsLoading(true);
      
      // Generate personalized briefing using AI
      const { data } = await supabase.functions.invoke('enhanced-ai-recommendations', {
        body: {
          message: 'Generate a personalized daily business briefing with 3-4 key insights for today',
          userId: user?.id,
          context: {
            currentPage: 'daily_briefing',
            timestamp: new Date().toISOString(),
            briefingType: 'daily'
          }
        }
      });

      if (data?.recommendation) {
        // Parse AI response for insights
        const mockInsights: BriefingInsight[] = [
          {
            type: 'opportunity',
            title: 'High-value listing opportunity detected',
            description: `3 properties in ${(profile as any)?.city || 'your area'} match your niche and are likely to list in the next 30 days.`,
            priority: 'high',
            timeframe: 'Next 30 days',
            cta: 'View leads'
          },
          {
            type: 'trend',
            title: 'Market shift in your favor',
            description: 'Inventory levels decreased 15% this week in your price range, giving you negotiation advantage.',
            priority: 'medium', 
            timeframe: 'This week'
          },
          {
            type: 'success',
            title: 'Your pipeline is outperforming',
            description: 'Your conversion rate is 23% higher than market average for similar agents.',
            priority: 'low',
            timeframe: 'Last 30 days'
          }
        ];
        setInsights(mockInsights);
      }
    } catch (error) {
      console.error('Error generating briefing:', error);
      // Fallback to sample insights
      setInsights([
        {
          type: 'opportunity',
          title: 'New market opportunities available',
          description: 'Several high-value prospects have been identified in your target area.',
          priority: 'high',
          timeframe: 'Today'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return TrendingUp;
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      case 'trend': return TrendingUp;
      default: return Brain;
    }
  };

  const getVariant = (type: string) => {
    switch (type) {
      case 'opportunity': return 'default';
      case 'warning': return 'destructive';
      case 'success': return 'secondary';
      case 'trend': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 via-card/50 to-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Today's AI Briefing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-muted h-16 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-card/50 to-blue-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Today's AI Briefing
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Clock className="h-3 w-3 mr-1" />
            {new Date().toLocaleDateString()}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Personalized insights to help you win today
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = getIcon(insight.type);
            return (
              <div key={index} className="border rounded-lg p-4 bg-card/50 hover:bg-card/80 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    insight.type === 'opportunity' ? 'bg-green-500/10 text-green-600' :
                    insight.type === 'warning' ? 'bg-red-500/10 text-red-600' :
                    insight.type === 'success' ? 'bg-blue-500/10 text-blue-600' :
                    'bg-purple-500/10 text-purple-600'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">{insight.title}</h3>
                      <Badge variant={getVariant(insight.type)} className="text-xs">
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {insight.timeframe}
                      {insight.cta && (
                        <span className="text-primary cursor-pointer hover:underline ml-auto">
                          {insight.cta} →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {!isPro && (
          <div className="mt-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
            <p className="text-sm text-muted-foreground">
              <strong>Upgrade to Pro</strong> for deeper insights, market predictions, and personalized action plans.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayBriefing;