import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAgentGPS } from '@/hooks/useAgentGPS';
import { TrendingUp, Users, Target, ArrowUp, Lock } from 'lucide-react';

interface PeerComparisonProps {
  onUpgrade?: () => void;
}

export function PeerComparison({ onUpgrade }: PeerComparisonProps) {
  const { peerComparison, successScore, archetype, loading, isProMember } = useAgentGPS();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Peer Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isProMember) {
    return (
      <Card className="border-2 border-dashed border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Peer Comparison
            <Badge className="bg-gradient-to-r from-primary to-primary/80">Pro Feature</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Compare with Top Performers</h3>
          <p className="text-muted-foreground mb-6">
            See how you stack up against similar agents and discover what tools top performers use.
          </p>
          <Button onClick={onUpgrade} className="w-full">
            Upgrade to Circle Pro
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!peerComparison || !successScore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Peer Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Complete your assessment and calculate your Success Path Score to see peer comparisons.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 80) return 'text-green-600';
    if (percentile >= 60) return 'text-blue-600';
    if (percentile >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPercentileMessage = (percentile: number) => {
    if (percentile >= 90) return 'You\'re in the top 10% of agents!';
    if (percentile >= 75) return 'You\'re performing better than most agents';
    if (percentile >= 50) return 'You\'re performing at the median level';
    return 'There\'s room for improvement';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Peer Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Percentile Ranking */}
        <div className="text-center p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
          <div className={`text-3xl font-bold ${getPercentileColor(peerComparison.your_percentile)}`}>
            {peerComparison.your_percentile}th
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            Percentile Ranking
          </div>
          <div className="text-sm font-medium">
            {getPercentileMessage(peerComparison.your_percentile)}
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-lg font-bold text-primary">
              {successScore.overall_score}
            </div>
            <div className="text-sm text-muted-foreground">Your Score</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-lg font-bold">
              {peerComparison.similar_agents_avg_score}
            </div>
            <div className="text-sm text-muted-foreground">Peer Average</div>
          </div>
        </div>

        {/* Archetype Information */}
        {archetype && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium">{archetype.archetype_name}</span>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              Similar agents close an average of {peerComparison.similar_agents_avg_deals} deals per year
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">{archetype.success_metrics?.avg_deals || 'N/A'}</div>
                <div className="text-muted-foreground">Avg Deals</div>
              </div>
              <div className="text-center">
                <div className="font-medium">${(archetype.success_metrics?.avg_volume || 0).toLocaleString()}</div>
                <div className="text-muted-foreground">Avg Volume</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{archetype.success_metrics?.team_size || 1}</div>
                <div className="text-muted-foreground">Team Size</div>
              </div>
            </div>
          </div>
        )}

        {/* Top Performers' Tools */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            What Top Performers Use
          </h4>
          <div className="flex flex-wrap gap-2">
            {peerComparison.top_performers_tools.slice(0, 4).map((tool, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tool}
              </Badge>
            ))}
          </div>
        </div>

        {/* Improvement Areas */}
        {peerComparison.improvement_areas.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <ArrowUp className="h-4 w-4" />
              Focus Areas for Growth
            </h4>
            <div className="space-y-2">
              {peerComparison.improvement_areas.slice(0, 3).map((area, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-sm">{area}</span>
                  <Badge variant="outline" className="text-xs">
                    Improve
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Gap */}
        <div className="p-4 border rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Performance Gap</span>
            <span className="text-sm text-muted-foreground">
              {successScore.overall_score > peerComparison.similar_agents_avg_score ? '+' : ''}
              {successScore.overall_score - peerComparison.similar_agents_avg_score} points
            </span>
          </div>
          <Progress 
            value={Math.min(100, (successScore.overall_score / 100) * 100)} 
            className="h-2 mb-1" 
          />
          <div className="text-xs text-muted-foreground">
            {successScore.overall_score > peerComparison.similar_agents_avg_score 
              ? 'Above peer average' 
              : 'Below peer average'
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}