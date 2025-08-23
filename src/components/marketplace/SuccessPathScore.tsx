import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, Trophy, Star, Crown, Lock } from 'lucide-react';

interface SuccessPathScoreProps {
  onUpgrade?: () => void;
}

interface ScoreData {
  overall_score: number;
  tool_adoption_score: number;
  performance_score: number;
  growth_score: number;
  peer_comparison_percentile: number;
  archetype_name?: string;
  archetype_description?: string;
  score_breakdown: any;
}

export function SuccessPathScore({ onUpgrade }: SuccessPathScoreProps) {
  const { user, profile } = useAuth();
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const isProMember = (profile as any)?.is_pro_member;

  useEffect(() => {
    if (user?.id) {
      fetchScoreData();
    }
  }, [user?.id]);

  const fetchScoreData = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('agent_success_path_scores')
        .select(`
          *,
          archetype:agent_archetypes(archetype_name, description)
        `)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching score data:', error);
        return;
      }

      if (data) {
        setScoreData({
          overall_score: data.overall_score,
          tool_adoption_score: data.tool_adoption_score,
          performance_score: data.performance_score,
          growth_score: data.growth_score,
          peer_comparison_percentile: data.peer_comparison_percentile,
          archetype_name: data.archetype?.archetype_name,
          archetype_description: data.archetype?.description,
          score_breakdown: data.score_breakdown
        });
      }
    } catch (error) {
      console.error('Error fetching score data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = async () => {
    if (!user?.id) return;

    setCalculating(true);
    try {
      const { data, error } = await supabase.rpc('calculate_success_path_score', {
        p_user_id: user.id
      });

      if (error) throw error;

      // Refresh score data
      await fetchScoreData();
    } catch (error) {
      console.error('Error calculating score:', error);
    } finally {
      setCalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getArchetypeBadge = (archetype: string) => {
    const badges = {
      'High Volume Rainmaker': { icon: Crown, color: 'bg-purple-100 text-purple-800' },
      'Solo Grinder': { icon: Star, color: 'bg-blue-100 text-blue-800' },
      'Sphere Builder': { icon: Users, color: 'bg-green-100 text-green-800' },
      'Listing Specialist': { icon: TrendingUp, color: 'bg-orange-100 text-orange-800' },
      'Team Leader': { icon: Trophy, color: 'bg-indigo-100 text-indigo-800' }
    };

    const badge = badges[archetype as keyof typeof badges] || { icon: Star, color: 'bg-gray-100 text-gray-800' };
    const Icon = badge.icon;

    return (
      <Badge className={`flex items-center gap-1 ${badge.color} border-0`}>
        <Icon className="h-3 w-3" />
        {archetype}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Success Path Score
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

  if (!scoreData && !isProMember) {
    return (
      <Card className="border-2 border-dashed border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Success Path Score
            <Badge className="bg-gradient-to-r from-primary to-primary/80">Pro Feature</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Unlock Your Agent GPS</h3>
            <p className="text-muted-foreground mb-6">
              Get your personalized Success Path Score, archetype classification, and peer comparisons with Circle Pro.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div className="text-center">
              <div className="font-semibold text-primary">95</div>
              <div className="text-muted-foreground">Success Score</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-primary">87th</div>
              <div className="text-muted-foreground">Percentile</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-primary">Top 15%</div>
              <div className="text-muted-foreground">Performance</div>
            </div>
          </div>
          <Button onClick={onUpgrade} className="w-full">
            Upgrade to Circle Pro
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Success Path Score
          </div>
          {scoreData && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={calculateScore}
              disabled={calculating}
            >
              {calculating ? 'Updating...' : 'Refresh'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {scoreData ? (
          <>
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(scoreData.overall_score)}`}>
                {scoreData.overall_score}
              </div>
              <div className="text-sm text-muted-foreground">Overall Success Score</div>
              {scoreData.archetype_name && (
                <div className="mt-2">
                  {getArchetypeBadge(scoreData.archetype_name)}
                </div>
              )}
            </div>

            {/* Peer Comparison */}
            <div className="text-center p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {scoreData.peer_comparison_percentile}th
              </div>
              <div className="text-sm text-muted-foreground">
                Percentile among similar agents
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-4">
              <h4 className="font-medium">Score Breakdown</h4>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tool Adoption</span>
                    <span className="font-medium">{scoreData.tool_adoption_score}/100</span>
                  </div>
                  <Progress value={scoreData.tool_adoption_score} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Performance</span>
                    <span className="font-medium">{scoreData.performance_score}/100</span>
                  </div>
                  <Progress value={scoreData.performance_score} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Growth Engagement</span>
                    <span className="font-medium">{scoreData.growth_score}/100</span>
                  </div>
                  <Progress value={scoreData.growth_score} className="h-2" />
                </div>
              </div>
            </div>

            {/* Archetype Description */}
            {scoreData.archetype_description && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Your Agent Archetype</h4>
                <p className="text-sm text-muted-foreground">
                  {scoreData.archetype_description}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="mb-4">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Calculate Your Score</h3>
              <p className="text-muted-foreground mb-6">
                Complete your assessment to get your personalized Success Path Score and agent archetype.
              </p>
            </div>
            <Button onClick={calculateScore} disabled={calculating}>
              {calculating ? 'Calculating...' : 'Calculate Score'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}