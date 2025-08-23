import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AgentArchetype {
  id: string;
  archetype_name: string;
  description: string;
  production_range_min: number;
  production_range_max: number;
  team_size_categories: string[];
  preferred_focus: string[];
  pain_points: string[];
  recommended_tools: any;
  success_metrics: any;
}

interface SuccessPathScore {
  overall_score: number;
  tool_adoption_score: number;
  performance_score: number;
  growth_score: number;
  peer_comparison_percentile: number;
  archetype_id?: string;
  score_breakdown: any;
  next_recommendations: any;
}

interface PeerComparison {
  your_percentile: number;
  similar_agents_avg_deals: number;
  similar_agents_avg_score: number;
  top_performers_tools: string[];
  improvement_areas: string[];
}

export function useAgentGPS() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [archetype, setArchetype] = useState<AgentArchetype | null>(null);
  const [successScore, setSuccessScore] = useState<SuccessPathScore | null>(null);
  const [peerComparison, setPeerComparison] = useState<PeerComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  const isProMember = (profile as any)?.is_pro_member;

  useEffect(() => {
    if (user?.id && isProMember) {
      fetchAgentGPSData();
    } else {
      setLoading(false);
    }
  }, [user?.id, isProMember]);

  const fetchAgentGPSData = async () => {
    if (!user?.id) return;

    try {
      // Fetch success path score with archetype
      const { data: scoreData, error: scoreError } = await supabase
        .from('agent_success_path_scores')
        .select(`
          *,
          archetype:agent_archetypes(*)
        `)
        .eq('user_id', user.id)
        .single();

      if (scoreError && scoreError.code !== 'PGRST116') {
        console.error('Error fetching score data:', scoreError);
      } else if (scoreData) {
        setSuccessScore({
          overall_score: scoreData.overall_score,
          tool_adoption_score: scoreData.tool_adoption_score,
          performance_score: scoreData.performance_score,
          growth_score: scoreData.growth_score,
          peer_comparison_percentile: scoreData.peer_comparison_percentile,
          archetype_id: scoreData.archetype_id,
          score_breakdown: scoreData.score_breakdown,
          next_recommendations: scoreData.next_recommendations
        });
        if (scoreData.archetype) {
          setArchetype(scoreData.archetype);
        }
      }

      // Calculate peer comparison if we have score data
      if (scoreData) {
        await calculatePeerComparison(scoreData);
      }
    } catch (error) {
      console.error('Error fetching Agent GPS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePeerComparison = async (scoreData: any) => {
    if (!user?.id || !profile) return;

    try {
      // Get industry benchmarks for similar production level
      const userGoal = (profile as any).annual_goal_transactions || 12;
      
      const { data: benchmarks, error } = await supabase
        .from('industry_benchmarks')
        .select('*')
        .eq('benchmark_type', 'production')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching benchmarks:', error);
        return;
      }

      // Calculate percentile based on score
      const percentile = Math.min(95, Math.max(5, 
        Math.round(50 + (scoreData.overall_score - 60) * 0.8)
      ));

      // Mock peer comparison data based on archetype and benchmarks
      const similarAgentsAvgDeals = archetype?.success_metrics?.avg_deals || userGoal;
      const topPerformersTools = archetype?.recommended_tools?.crm || ['Follow Up Boss', 'KVCore'];

      const comparison: PeerComparison = {
        your_percentile: percentile,
        similar_agents_avg_deals: similarAgentsAvgDeals,
        similar_agents_avg_score: scoreData.overall_score - 10,
        top_performers_tools: topPerformersTools,
        improvement_areas: getImprovementAreas(scoreData)
      };

      setPeerComparison(comparison);
    } catch (error) {
      console.error('Error calculating peer comparison:', error);
    }
  };

  const getImprovementAreas = (scoreData: any) => {
    const areas = [];
    
    if (scoreData.tool_adoption_score < 70) {
      areas.push('Tool Integration');
    }
    if (scoreData.performance_score < 70) {
      areas.push('Goal Achievement');
    }
    if (scoreData.growth_score < 70) {
      areas.push('Professional Development');
    }
    
    return areas.length > 0 ? areas : ['Lead Generation', 'Follow-up Systems'];
  };

  const calculateSuccessScore = async () => {
    if (!user?.id) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to calculate your success score.',
        variant: 'destructive'
      });
      return;
    }

    if (!isProMember) {
      toast({
        title: 'Circle Pro Required',
        description: 'Success Path Score is available for Circle Pro members.',
        variant: 'destructive'
      });
      return;
    }

    setIsCalculating(true);
    try {
      const { data, error } = await supabase.rpc('calculate_success_path_score', {
        p_user_id: user.id
      });

      if (error) throw error;

      toast({
        title: 'Score Updated',
        description: `Your Success Path Score has been recalculated: ${data}/100`,
      });

      // Refresh the data
      await fetchAgentGPSData();
    } catch (error) {
      console.error('Error calculating success score:', error);
      toast({
        title: 'Calculation Failed',
        description: 'Unable to calculate your success score. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const getArchetypeRecommendations = async () => {
    if (!archetype || !isProMember) return [];

    try {
      // Get services that match archetype recommendations  
      const { data: services, error } = await supabase
        .from('services')
        .select('*, vendor:vendors(name, logo_url)')
        .eq('status', 'active')
        .limit(6);

      if (error) {
        console.error('Error fetching archetype recommendations:', error);
        return [];
      }

      return services || [];
    } catch (error) {
      console.error('Error getting archetype recommendations:', error);
      return [];
    }
  };

  const getNextLevelInsights = () => {
    if (!successScore || !peerComparison) return null;

    const currentScore = successScore.overall_score;
    const nextMilestone = Math.ceil(currentScore / 20) * 20;
    const pointsToNext = nextMilestone - currentScore;
    
    return {
      current_level: Math.floor(currentScore / 20) + 1,
      next_milestone: nextMilestone,
      points_needed: pointsToNext,
      top_action: peerComparison.improvement_areas[0] || 'Complete your assessment',
      unlock_feature: 'Advanced AI Recommendations'
    };
  };

  return {
    archetype,
    successScore,
    peerComparison,
    loading,
    isCalculating,
    isProMember,
    calculateSuccessScore,
    getArchetypeRecommendations,
    getNextLevelInsights,
    refreshData: fetchAgentGPSData
  };
}