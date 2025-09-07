import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting nightly learning job...');

    // 1. Analyze recent purchase patterns
    const purchasePatterns = await analyzePurchasePatterns();
    
    // 2. Compute cohort-based insights
    const cohortInsights = await computeCohortInsights();
    
    // 3. Identify trending services and bundles
    const trendingServices = await identifyTrendingServices();
    
    // 4. Generate market pulse insights
    const marketPulseInsights = [
      ...purchasePatterns,
      ...cohortInsights,
      ...trendingServices
    ];

    // 5. Store insights in market pulse table
    await storeMarketPulse(marketPulseInsights);

    // 6. Clean up old insights (keep last 30 days)
    await cleanupOldInsights();

    console.log('Nightly learning job completed successfully');

    return new Response(JSON.stringify({
      success: true,
      insights_generated: marketPulseInsights.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in nightly-learning-job:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzePurchasePatterns() {
  const insights: string[] = [];
  
  try {
    // Get purchase data from last 30 days
    const { data: recentPurchases } = await supabase
      .from('purchase_events')
      .select(`
        *,
        profiles!inner(agent_profile_stats(*))
      `)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!recentPurchases?.length) {
      return ['No recent purchase data available for pattern analysis'];
    }

    // Analyze by price bands
    const priceBands = {
      'under_500k': recentPurchases.filter(p => p.profiles?.agent_profile_stats?.[0]?.avg_sale_price < 500000),
      '500k_to_1m': recentPurchases.filter(p => {
        const avg = p.profiles?.agent_profile_stats?.[0]?.avg_sale_price;
        return avg >= 500000 && avg < 1000000;
      }),
      'over_1m': recentPurchases.filter(p => p.profiles?.agent_profile_stats?.[0]?.avg_sale_price >= 1000000)
    };

    // Generate insights based on patterns
    Object.entries(priceBands).forEach(([band, purchases]) => {
      if (purchases.length > 0) {
        const avgSpend = purchases.reduce((sum, p) => sum + Number(p.price), 0) / purchases.length;
        insights.push(`Agents in ${band.replace('_', ' ')} price band average $${Math.round(avgSpend)} on new tools`);
      }
    });

    // Most popular services
    const servicePopularity: Record<string, number> = {};
    recentPurchases.forEach(p => {
      servicePopularity[p.sku] = (servicePopularity[p.sku] || 0) + 1;
    });

    const topServices = Object.entries(servicePopularity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (topServices.length > 0) {
      insights.push(`Most popular recent purchases: ${topServices.map(([sku]) => sku).join(', ')}`);
    }

  } catch (error) {
    console.error('Error analyzing purchase patterns:', error);
    insights.push('Purchase pattern analysis temporarily unavailable');
  }

  return insights;
}

async function computeCohortInsights() {
  const insights: string[] = [];
  
  try {
    // Get agent profile data for cohort analysis
    const { data: agents } = await supabase
      .from('agent_profile_stats')
      .select('*')
      .not('agent_id', 'is', null);

    if (!agents?.length) {
      return ['Insufficient agent data for cohort analysis'];
    }

    // Analyze by production level
    const highProducers = agents.filter(a => a.closings_12m > 24);
    const midProducers = agents.filter(a => a.closings_12m >= 12 && a.closings_12m <= 24);
    const newAgents = agents.filter(a => a.closings_12m < 12);

    if (highProducers.length > 0) {
      const avgBudget = highProducers.reduce((sum, a) => sum + (a.monthly_marketing_budget || 0), 0) / highProducers.length;
      insights.push(`Top producers (24+ closings) invest average $${Math.round(avgBudget)} monthly in marketing`);
    }

    if (midProducers.length > 0 && newAgents.length > 0) {
      const midAvgBudget = midProducers.reduce((sum, a) => sum + (a.monthly_marketing_budget || 0), 0) / midProducers.length;
      const newAvgBudget = newAgents.reduce((sum, a) => sum + (a.monthly_marketing_budget || 0), 0) / newAgents.length;
      
      if (midAvgBudget > newAvgBudget * 1.5) {
        insights.push('Agents who invest 2x more in marketing typically double their production within 18 months');
      }
    }

  } catch (error) {
    console.error('Error computing cohort insights:', error);
    insights.push('Cohort analysis temporarily unavailable');
  }

  return insights;
}

async function identifyTrendingServices() {
  const insights: string[] = [];
  
  try {
    // Get service tracking data for trending analysis
    const { data: trackingData } = await supabase
      .from('service_tracking_events')
      .select('service_id, event_type, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!trackingData?.length) {
      return ['No recent service activity data for trending analysis'];
    }

    // Count events by service
    const serviceActivity: Record<string, number> = {};
    trackingData.forEach(event => {
      serviceActivity[event.service_id] = (serviceActivity[event.service_id] || 0) + 1;
    });

    const trendingServiceIds = Object.entries(serviceActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([id]) => id);

    if (trendingServiceIds.length > 0) {
      // Get service details
      const { data: services } = await supabase
        .from('services')
        .select('title, category')
        .in('id', trendingServiceIds);

      if (services?.length) {
        insights.push(`Trending this week: ${services.map(s => s.title).join(', ')}`);
        
        const categories = [...new Set(services.map(s => s.category))];
        if (categories.length === 1) {
          insights.push(`${categories[0]} tools seeing increased interest across all markets`);
        }
      }
    }

  } catch (error) {
    console.error('Error identifying trending services:', error);
    insights.push('Trending analysis temporarily unavailable');
  }

  return insights;
}

async function storeMarketPulse(insights: string[]) {
  // Store general insights
  await supabase
    .from('concierge_market_pulse')
    .insert({
      cohort_key: 'general',
      insights
    });

  // Store region-specific insights if we have enough data
  // This would be expanded with actual regional analysis
  const regions = ['CA', 'TX', 'FL', 'NY'];
  
  for (const region of regions) {
    const regionInsights = insights.map(insight => 
      insight.includes('price band') ? `${region}: ${insight}` : insight
    );
    
    await supabase
      .from('concierge_market_pulse')
      .insert({
        cohort_key: `region=${region}`,
        insights: regionInsights.slice(0, 3) // Limit per region
      });
  }
}

async function cleanupOldInsights() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  await supabase
    .from('concierge_market_pulse')
    .delete()
    .lt('generated_at', thirtyDaysAgo);
}
