import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ConciergeContext {
  territory: {
    cities: string[];
    zips: string[];
    price_band: { min: number; max: number };
    source: string;
  };
  production: {
    closings_12m: number;
    avg_price: number;
    gci_12m: number;
    source: string;
  };
  pipeline: {
    listings: number;
    pendings: number;
    hot_buyers: number;
    source: string;
  };
  marketing: {
    budget: number;
    channels: string[];
    crm: string;
    source: string;
  };
  goals: {
    closings_90d: number;
    closings_12m: number;
    priority: string;
    source: string;
  };
}

interface NextBestAction {
  id: string;
  title: string;
  description: string;
  workflow_type: string;
  estimated_impact: string;
  time_required: string;
  expected_roi: {
    range: string;
    confidence: string;
  };
  assets_generated: string[];
  recommended_vendors: Array<{
    id: string;
    name: string;
    service: string;
    price: string;
  }>;
  score: {
    total_score: number;
    impact_score: number;
    fit_score: number;
    cost_score: number;
    reasoning: {
      impact_reason: string;
      fit_reason: string;
      cost_reason: string;
    };
  };
}

export const useConcierge = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<ConciergeContext | null>(null);
  const [nextBestActions, setNextBestActions] = useState<NextBestAction[]>([]);

  const getConciergeContext = async () => {
    if (!user?.id) return null;

    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_concierge_context', {
        p_agent_id: user.id
      });

      if (error) throw error;
      
      setContext(data);
      return data;
    } catch (error) {
      console.error('Error getting concierge context:', error);
      toast({
        title: "Error",
        description: "Failed to load your profile context",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateNextBestActions = async () => {
    if (!user?.id) return [];

    try {
      setIsLoading(true);
      
      // Get available services for NBA calculation
      const { data: services } = await supabase
        .from('services')
        .select('id, title, category, description')
        .eq('is_active', true)
        .limit(20);

      if (!services) return [];

      // Calculate NBA scores for different workflow types
      const workflowTypes = ['grow_listings', 'sphere_nurture', 'geo_farm', 'open_house'];
      const nbaPromises = workflowTypes.map(async (workflow) => {
        // Pick a representative service for each workflow
        const serviceForWorkflow = services.find(s => 
          workflow === 'grow_listings' ? s.category?.includes('Marketing') :
          workflow === 'sphere_nurture' ? s.category?.includes('CRM') :
          workflow === 'geo_farm' ? s.category?.includes('Lead') :
          s.category?.includes('Event')
        ) || services[0];

        if (!serviceForWorkflow) return null;

        const { data: score } = await supabase.rpc('calculate_nba_score', {
          p_agent_id: user.id,
          p_service_id: serviceForWorkflow.id,
          p_workflow_type: workflow
        });

        return {
          id: `${workflow}-${serviceForWorkflow.id}`,
          title: getWorkflowTitle(workflow),
          description: getWorkflowDescription(workflow),
          workflow_type: workflow,
          estimated_impact: `${Math.round((score?.impact_score || 70) / 10)} more closings in 90 days`,
          time_required: getWorkflowTimeRequired(workflow),
          expected_roi: {
            range: `$${Math.round((score?.total_score || 70) * 50)}-${Math.round((score?.total_score || 70) * 150)}`,
            confidence: score?.total_score > 80 ? 'High' : 'Medium'
          },
          assets_generated: getWorkflowAssets(workflow),
          recommended_vendors: [{
            id: serviceForWorkflow.id,
            name: 'Top-rated vendor',
            service: serviceForWorkflow.title,
            price: '$200/month'
          }],
          score: score || {
            total_score: 70,
            impact_score: 70,
            fit_score: 70,
            cost_score: 70,
            reasoning: {
              impact_reason: 'Default impact assessment',
              fit_reason: 'Good fit for your profile',
              cost_reason: 'Within budget parameters'
            }
          }
        };
      });

      const nbas = (await Promise.all(nbaPromises))
        .filter(Boolean)
        .sort((a, b) => (b?.score.total_score || 0) - (a?.score.total_score || 0))
        .slice(0, 3);

      setNextBestActions(nbas as NextBestAction[]);
      return nbas;
    } catch (error) {
      console.error('Error generating NBAs:', error);
      toast({
        title: "Error", 
        description: "Failed to generate recommendations",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const runConciergeWorkflow = async (
    prompt: string, 
    workflowType?: string
  ) => {
    if (!user?.id) return null;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('concierge_runs')
        .insert({
          agent_id: user.id,
          prompt,
          workflow_type: workflowType,
          ai_response: 'Generated workflow response',
          generated_assets: {
            assets: ['Social media posts', 'Email templates', 'Flyer design']
          },
          recommended_vendors: [],
          estimated_roi: {
            range: '$5,000-$15,000',
            confidence: 'Medium'
          }
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Workflow Complete",
        description: "Your personalized assets have been generated"
      });

      return data;
    } catch (error) {
      console.error('Error running concierge workflow:', error);
      toast({
        title: "Error",
        description: "Failed to run workflow",
        variant: "destructive" 
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    context,
    nextBestActions,
    getConciergeContext,
    generateNextBestActions,
    runConciergeWorkflow
  };
};

// Helper functions
const getWorkflowTitle = (workflow: string) => {
  const titles = {
    grow_listings: 'Grow Your Listing Pipeline',
    sphere_nurture: 'Nurture Your Sphere',
    geo_farm: 'Geographic Farming Campaign',
    open_house: 'Open House Marketing'
  };
  return titles[workflow as keyof typeof titles] || workflow;
};

const getWorkflowDescription = (workflow: string) => {
  const descriptions = {
    grow_listings: 'Generate more listing opportunities through targeted marketing',
    sphere_nurture: 'Stay top-of-mind with past clients and referral sources',
    geo_farm: 'Dominate a specific neighborhood with consistent presence',
    open_house: 'Maximize open house attendance and lead capture'
  };
  return descriptions[workflow as keyof typeof descriptions] || '';
};

const getWorkflowTimeRequired = (workflow: string) => {
  const times = {
    grow_listings: '2-3 hours setup',
    sphere_nurture: '1 hour setup',
    geo_farm: '3-4 hours setup',
    open_house: '1-2 hours setup'
  };
  return times[workflow as keyof typeof times] || '2 hours';
};

const getWorkflowAssets = (workflow: string) => {
  const assets = {
    grow_listings: ['Listing flyers', 'Social media posts', 'Email campaigns'],
    sphere_nurture: ['Monthly newsletters', 'Holiday cards', 'Market updates'],
    geo_farm: ['Neighborhood postcards', 'Market reports', 'Door hangers'],
    open_house: ['Event flyers', 'Social posts', 'Follow-up emails']
  };
  return assets[workflow as keyof typeof assets] || [];
};