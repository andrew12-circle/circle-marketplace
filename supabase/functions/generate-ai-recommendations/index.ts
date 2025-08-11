import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { agent_id } = await req.json();

    if (!agent_id) {
      return new Response(
        JSON.stringify({ error: 'agent_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating recommendations for agent: ${agent_id}`);

    // Get agent profile and goals
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', agent_id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Agent profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if goals are set
    if (!profile.onboarding_completed || !profile.primary_challenge) {
      return new Response(
        JSON.stringify({ 
          error: 'Agent needs to complete goal assessment first',
          requires_assessment: true 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get market benchmarks for agent's location and tier
    const agentTier = getAgentTier(profile);
    const { data: benchmarks } = await supabase
      .from('market_benchmarks')
      .select('*')
      .eq('state', profile.state || 'National')
      .eq('agent_tier', agentTier)
      .eq('benchmark_year', 2024)
      .limit(1);

    // Get available services
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('is_published', true)
      .limit(50);

    // Get service bundles that match the agent's challenge
    const { data: bundles } = await supabase
      .from('ai_service_bundles')
      .select('*')
      .contains('target_challenges', [profile.primary_challenge])
      .eq('is_active', true);

    // Generate recommendations based on profile
    const recommendations = await generateRecommendations(
      profile, 
      benchmarks?.[0], 
      services || [], 
      bundles || [],
      openaiApiKey
    );

    // Save recommendations to database
    for (const rec of recommendations) {
      await supabase
        .from('goal_based_recommendations')
        .upsert({
          agent_id,
          ...rec,
          created_at: new Date().toISOString()
        });
    }

    console.log(`Generated ${recommendations.length} recommendations for agent ${agent_id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        recommendations_count: recommendations.length,
        agent_tier: agentTier
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getAgentTier(profile: any): string {
  const experience = profile.years_experience || 0;
  const goalTransactions = profile.annual_goal_transactions || 0;
  
  if (experience < 2 || goalTransactions < 6) return 'new';
  if (experience < 5 || goalTransactions < 12) return 'growing';
  if (experience < 10 || goalTransactions < 24) return 'established';
  return 'top_producer';
}

async function generateRecommendations(
  profile: any, 
  benchmark: any, 
  services: any[], 
  bundles: any[],
  openaiApiKey?: string
): Promise<any[]> {
  const recommendations: any[] = [];

  // 1. Generate benchmark comparison recommendation
  if (benchmark) {
    const gapAnalysis = analyzeBenchmarkGap(profile, benchmark);
    if (gapAnalysis.hasGap) {
      recommendations.push({
        recommendation_type: 'benchmark',
        recommendation_text: gapAnalysis.recommendation,
        confidence_score: 0.9,
        estimated_roi_percentage: gapAnalysis.potential_roi,
        priority_rank: 1
      });
    }
  }

  // 2. Generate challenge-specific service recommendations
  const challengeServices = filterServicesByChallenge(services, profile.primary_challenge);
  const topServices = challengeServices
    .slice(0, 3)
    .map((service, index) => ({
      recommendation_type: 'service',
      service_id: service.id,
      recommendation_text: `Consider "${service.title}" to address your ${profile.primary_challenge} challenge. This service has strong reviews and fits your budget preference.`,
      confidence_score: 0.8 - (index * 0.1),
      estimated_roi_percentage: estimateServiceROI(service, profile),
      priority_rank: index + 2
    }));

  recommendations.push(...topServices);

  // 3. Generate bundle recommendations
  const suitableBundles = bundles
    .filter(bundle => matchesBudgetPreference(bundle, profile.budget_preference))
    .slice(0, 2)
    .map((bundle, index) => ({
      recommendation_type: 'bundle',
      bundle_id: bundle.id,
      recommendation_text: `The "${bundle.bundle_name}" bundle is optimized for agents facing ${profile.primary_challenge} challenges and offers ${bundle.estimated_roi_percentage}% ROI.`,
      confidence_score: 0.85,
      estimated_roi_percentage: bundle.estimated_roi_percentage,
      priority_rank: index + 5
    }));

  recommendations.push(...suitableBundles);

  // 4. Generate strategic recommendations using AI if available
  if (openaiApiKey && recommendations.length < 5) {
    try {
      const aiRecommendation = await generateAIRecommendation(profile, benchmark, openaiApiKey);
      if (aiRecommendation) {
        recommendations.push({
          recommendation_type: 'strategy',
          recommendation_text: aiRecommendation,
          confidence_score: 0.75,
          estimated_roi_percentage: 15,
          priority_rank: 10
        });
      }
    } catch (error) {
      console.error('Error generating AI recommendation:', error);
    }
  }

  return recommendations.sort((a, b) => a.priority_rank - b.priority_rank);
}

function analyzeBenchmarkGap(profile: any, benchmark: any) {
  const goalTransactions = profile.annual_goal_transactions || 0;
  const benchmarkTransactions = benchmark.avg_transactions_per_year || 0;
  
  if (goalTransactions > benchmarkTransactions * 1.2) {
    return {
      hasGap: true,
      recommendation: `Your goal of ${goalTransactions} transactions is ambitious! Top performers in ${profile.state || 'your market'} average ${benchmarkTransactions} transactions. Focus on lead generation and conversion optimization to bridge this gap.`,
      potential_roi: 25
    };
  }
  
  if (goalTransactions < benchmarkTransactions * 0.8) {
    return {
      hasGap: true,
      recommendation: `You could aim higher! Average agents in ${profile.state || 'your market'} close ${benchmarkTransactions} transactions annually. Consider increasing your goal and investing in proven systems.`,
      potential_roi: 20
    };
  }
  
  return { hasGap: false };
}

function filterServicesByChallenge(services: any[], challenge: string): any[] {
  const challengeKeywords: Record<string, string[]> = {
    'lead_generation': ['lead', 'prospecting', 'marketing', 'advertising', 'crm'],
    'branding': ['brand', 'design', 'social', 'marketing', 'website'],
    'systems': ['crm', 'automation', 'workflow', 'transaction', 'management'],
    'conversion': ['conversion', 'follow-up', 'nurturing', 'communication'],
    'follow_up': ['follow-up', 'nurturing', 'drip', 'email', 'communication'],
    'pricing': ['pricing', 'valuation', 'market', 'analysis', 'cma'],
    'market_knowledge': ['market', 'analytics', 'data', 'insights', 'trends']
  };

  const keywords = challengeKeywords[challenge] || [];
  
  return services
    .filter(service => {
      const serviceText = `${service.title} ${service.description || ''} ${service.category || ''}`.toLowerCase();
      return keywords.some(keyword => serviceText.includes(keyword));
    })
    .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
}

function estimateServiceROI(service: any, profile: any): number {
  const baseROI = 15;
  const commissionValue = profile.average_commission_per_deal || 5000;
  const servicePrice = parseFloat(service.retail_price?.replace(/[^0-9.]/g, '') || '100');
  
  // Higher commission agents can afford more expensive services
  if (commissionValue > 7000 && servicePrice < 500) return baseROI + 10;
  if (commissionValue > 5000 && servicePrice < 300) return baseROI + 5;
  
  return baseROI;
}

function matchesBudgetPreference(bundle: any, budgetPreference: string): boolean {
  const price = bundle.total_price || 0;
  
  switch (budgetPreference) {
    case 'low_cost':
      return price < 500;
    case 'balanced':
      return price >= 500 && price <= 2000;
    case 'high_investment':
      return price > 2000;
    default:
      return true;
  }
}

async function generateAIRecommendation(profile: any, benchmark: any, openaiApiKey: string): Promise<string | null> {
  try {
    const prompt = `As a real estate business consultant, provide ONE specific strategic recommendation for an agent with these details:
    
Goals: ${profile.annual_goal_transactions} transactions, $${profile.annual_goal_volume} volume
Challenge: ${profile.primary_challenge}
Experience: ${profile.years_experience} years
Location: ${profile.city}, ${profile.state}
Budget: ${profile.budget_preference}
Time: ${profile.marketing_time_per_week} hours/week for marketing

Market benchmark: ${benchmark?.avg_transactions_per_year || 'N/A'} avg transactions in market

Provide a 1-2 sentence strategic recommendation that is specific and actionable.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are a real estate business consultant providing strategic recommendations.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return null;
  }
}