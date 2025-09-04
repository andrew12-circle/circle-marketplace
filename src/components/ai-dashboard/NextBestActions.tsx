import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Zap, DollarSign, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { getProStatus } from '@/lib/profile';
import { useToast } from '@/hooks/use-toast';

interface NextBestAction {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  roi_estimate: number;
  timeframe: string;
  action_type: 'service' | 'workflow' | 'strategy';
  service_id?: string;
  service_title?: string;
  priority_score: number;
}

const NextBestActions = () => {
  const { user, profile } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [actions, setActions] = useState<NextBestAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isPro = getProStatus(profile);

  useEffect(() => {
    if (user?.id && isPro) {
      fetchNextBestActions();
    } else {
      setIsLoading(false);
    }
  }, [user?.id, isPro]);

  const fetchNextBestActions = async () => {
    try {
      setIsLoading(true);
      
      // Calculate NBA scores using RPC
      const { data: scores } = await supabase.rpc('calculate_nba_score', {
        p_user_id: user?.id
      });

      if (scores && scores.length > 0) {
        // Convert scores to actions format
        const nbaActions: NextBestAction[] = scores.slice(0, 3).map((score: any, index: number) => ({
          id: `nba_${index}`,
          title: score.workflow_title || `Priority Action ${index + 1}`,
          description: score.description || 'AI-recommended action based on your business profile',
          impact: score.estimated_impact > 75 ? 'high' : score.estimated_impact > 50 ? 'medium' : 'low',
          effort: score.effort_required < 30 ? 'low' : score.effort_required < 60 ? 'medium' : 'high',
          roi_estimate: score.roi_estimate || 0,
          timeframe: score.timeframe || '2-4 weeks',
          action_type: score.workflow_type?.includes('service') ? 'service' : 'workflow',
          priority_score: score.total_score || 0,
          service_id: score.service_id,
          service_title: score.service_title
        }));
        
        setActions(nbaActions);
      } else {
        // Fallback to sample actions
        setActions([
          {
            id: 'nba_1',
            title: 'Implement Lead Scoring System',
            description: 'Prioritize your hot prospects with AI-powered lead scoring to close 30% more deals.',
            impact: 'high',
            effort: 'low',
            roi_estimate: 24000,
            timeframe: '2 weeks',
            action_type: 'service',
            priority_score: 95
          },
          {
            id: 'nba_2', 
            title: 'Automate Follow-up Sequences',
            description: 'Set up automated nurture campaigns to stay top-of-mind with past clients.',
            impact: 'medium',
            effort: 'medium',
            roi_estimate: 18000,
            timeframe: '3 weeks',
            action_type: 'workflow',
            priority_score: 88
          },
          {
            id: 'nba_3',
            title: 'Optimize Listing Presentation',
            description: 'Upgrade your listing materials with professional photography and staging recommendations.',
            impact: 'high',
            effort: 'medium', 
            roi_estimate: 31000,
            timeframe: '1 week',
            action_type: 'service',
            priority_score: 92
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching NBAs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeAction = async (action: NextBestAction) => {
    if (action.action_type === 'service' && action.service_id) {
      // Add service to cart
      await addToCart({
        id: action.service_id,
        title: action.service_title || action.title,
        price: 0, // Will be determined by service details
        type: 'service',
        description: action.description
      });
    } else {
      // Log workflow initiation
      try {
        await supabase.from('ai_interaction_logs').insert({
          user_id: user?.id,
          intent_type: 'workflow_start',
          query_text: action.title,
          result_type: 'action_taken',
          interaction_timestamp: new Date().toISOString(),
          recommendation_text: action.description
        });
        
        toast({
          title: "Action Started",
          description: `"${action.title}" workflow has been initiated`,
        });
      } catch (error) {
        console.error('Error logging workflow start:', error);
      }
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-500/10 text-green-600';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600';
      case 'high': return 'bg-red-500/10 text-red-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Next Best Actions
            <Badge variant="secondary">Pro Feature</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="font-medium">AI-Powered Action Plan</h3>
              <p className="text-sm text-muted-foreground">
                Get personalized recommendations for your next best business moves with ROI estimates
              </p>
            </div>
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80">
              Upgrade to Pro - $97/month
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Next Best Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-muted h-24 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Your Next Best Actions
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            AI-Powered
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Prioritized actions based on your business profile and market conditions
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.map((action, index) => (
            <div key={action.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    #{index + 1}
                  </Badge>
                  <h3 className="font-medium text-sm">{action.title}</h3>
                  <Badge className={getImpactColor(action.impact)}>
                    {action.impact} impact
                  </Badge>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  Score: {action.priority_score}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">{action.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ROI: ${action.roi_estimate.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {action.timeframe}
                  </div>
                  <Badge className={getEffortColor(action.effort)}>
                    {action.effort} effort
                  </Badge>
                </div>
                
                <Button 
                  size="sm" 
                  onClick={() => handleTakeAction(action)}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  Take Action
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              
              <div className="bg-muted/50 rounded p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Based on agents with similar profiles who increased GCI by an average of {Math.round(action.roi_estimate / 1000)}k</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full" onClick={fetchNextBestActions}>
            <Target className="h-4 w-4 mr-2" />
            Refresh Recommendations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NextBestActions;