import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Crown, Activity, Calendar } from 'lucide-react';

interface PromotionResult {
  success: boolean;
  totalContent: number;
  top20PercentCount: number;
  promoted: number;
  demoted: number;
  topContent: Array<{
    title: string;
    score: number;
    total_plays: number;
    rating: number;
  }>;
}

export const ContentPromotionPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<PromotionResult | null>(null);

  const runContentPromotion = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('promote-top-content');
      
      if (error) throw error;
      
      setLastRun(data);
      
      toast({
        title: 'Content Promotion Complete',
        description: `Promoted ${data.promoted} items, demoted ${data.demoted} items`,
      });
    } catch (error) {
      console.error('Error running content promotion:', error);
      toast({
        title: 'Error',
        description: 'Failed to run content promotion',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Content Promotion System
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Automatically promote top 20% of content to pro status based on performance
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Performance-Based Promotion</h4>
            <p className="text-sm text-muted-foreground">
              Ranking based on plays (70%) + quality score (30%)
            </p>
          </div>
          <Button 
            onClick={runContentPromotion} 
            disabled={loading}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            {loading ? 'Processing...' : 'Run Promotion'}
          </Button>
        </div>

        {lastRun && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Last Run Results
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{lastRun.totalContent}</div>
                <div className="text-xs text-muted-foreground">Total Content</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{lastRun.top20PercentCount}</div>
                <div className="text-xs text-muted-foreground">Top 20%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{lastRun.promoted}</div>
                <div className="text-xs text-muted-foreground">Promoted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{lastRun.demoted}</div>
                <div className="text-xs text-muted-foreground">Demoted</div>
              </div>
            </div>

            {lastRun.topContent && lastRun.topContent.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Current Top Performers</h5>
                <div className="space-y-2">
                  {lastRun.topContent.map((content, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <span className="text-sm font-medium">{content.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{content.total_plays} plays</span>
                        <span>★ {content.rating.toFixed(1)}</span>
                        <span className="font-medium">{content.score.toFixed(1)} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Recommendation: Run weekly or when content performance changes significantly
        </div>
      </CardContent>
    </Card>
  );
};