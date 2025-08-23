import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAgentGPS() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [archetype, setArchetype] = useState<any>(null);
  const [successScore, setSuccessScore] = useState<any>(null);
  const [peerComparison, setPeerComparison] = useState<any>(null);
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
      const scoreResponse = await supabase
        .from('agent_success_path_scores')
        .select('*, archetype:agent_archetypes(*)')
        .eq('user_id', user.id)
        .single();

      if (scoreResponse.error && scoreResponse.error.code !== 'PGRST116') {
        console.error('Error fetching score data:', scoreResponse.error);
      } else if (scoreResponse.data) {
        setSuccessScore({
          overall_score: scoreResponse.data.overall_score,
          tool_adoption_score: scoreResponse.data.tool_adoption_score,
          performance_score: scoreResponse.data.performance_score,
          growth_score: scoreResponse.data.growth_score,
          peer_comparison_percentile: scoreResponse.data.peer_comparison_percentile,
          archetype_id: scoreResponse.data.archetype_id,
          score_breakdown: scoreResponse.data.score_breakdown,
          next_recommendations: scoreResponse.data.next_recommendations
        });
        
        if (scoreResponse.data.archetype) {
          setArchetype(scoreResponse.data.archetype);
        }

        // Calculate peer comparison
        await calculatePeerComparison(scoreResponse.data);
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
      const userGoal = (profile as any).annual_goal_transactions || 12;
      
      // Calculate percentile based on score
      const percentile = Math.min(95, Math.max(5, 
        Math.round(50 + (scoreData.overall_score - 60) * 0.8)
      ));

      // Mock peer comparison data based on archetype
      const similarAgentsAvgDeals = archetype?.success_metrics?.avg_deals || userGoal;
      const topPerformersTools = ['Follow Up Boss', 'KVCore', 'Ylopo'];

      const comparison = {
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
      const response = await supabase.rpc('calculate_success_path_score', {
        p_user_id: user.id
      });

      if (response.error) throw response.error;

      toast({
        title: 'Score Updated',
        description: `Your Success Path Score has been recalculated: ${response.data}/100`,
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

  const getArchetypeRecommendations = () => {
    // Return static recommendations to avoid complex Supabase queries
    if (!archetype || !isProMember) return [];

    return [
      { id: '1', title: 'CRM System', description: 'Professional contact management' },
      { id: '2', title: 'Lead Generation', description: 'Advanced lead capture tools' },
      { id: '3', title: 'Marketing Automation', description: 'Automated marketing campaigns' }
    ];
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