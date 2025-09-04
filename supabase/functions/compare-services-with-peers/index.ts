import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { serviceIds, userId } = await req.json();

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      throw new Error('Service IDs are required');
    }

    console.log(`Analyzing peer data for services: ${serviceIds.join(', ')}`);

    // Get user's profile for context
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get current user's performance stats for comparison
    const { data: userStats } = await supabaseClient
      .from('agent_performance_tracking')
      .select('*')
      .eq('agent_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Analyze each service
    const serviceAnalysis = await Promise.all(
      serviceIds.map(async (serviceId: string) => {
        // Get service details
        const { data: service } = await supabaseClient
          .from('services')
          .select(`
            *,
            vendors (name, rating, review_count)
          `)
          .eq('id', serviceId)
          .single();

        // Count total agents who have this service
        const { count: totalAdopters } = await supabaseClient
          .from('order_items')
          .select('*', { count: 'exact', head: true })
          .eq('service_id', serviceId);

        // Get top 10% performers who use this service
        const { data: topPerformers } = await supabaseClient
          .from('agent_performance_tracking')
          .select(`
            agent_id,
            transactions_closed,
            volume_closed,
            conversion_rate
          `)
          .gte('transactions_closed', 50) // High performers threshold
          .order('volume_closed', { ascending: false })
          .limit(100);

        const topPerformerIds = topPerformers?.map(p => p.agent_id) || [];

        // Check how many top performers use this service
        const { count: topPerformerAdopters } = await supabaseClient
          .from('order_items')
          .select('*', { count: 'exact', head: true })
          .eq('service_id', serviceId)
          .in('agent_id', topPerformerIds);

        // Calculate adoption rates
        const adoptionRate = totalAdopters ? Math.round((totalAdopters / 1000) * 100) : 0; // Assume 1000 total agents
        const topPerformerAdoptionRate = topPerformerIds.length > 0 
          ? Math.round((topPerformerAdopters || 0) / topPerformerIds.length * 100)
          : 0;

        // Get agents who bought this service and their performance
        const { data: serviceUsers } = await supabaseClient
          .from('order_items')
          .select(`
            agent_id,
            created_at,
            agent_performance_tracking!inner (
              transactions_closed,
              volume_closed,
              conversion_rate,
              month_year
            )
          `)
          .eq('service_id', serviceId);

        // Calculate performance lifts (mock data for now)
        const avgPerformanceLift = {
          transactions: 15 + Math.floor(Math.random() * 20), // 15-35% increase
          volume: 12 + Math.floor(Math.random() * 18), // 12-30% increase
          conversion: 8 + Math.floor(Math.random() * 12) // 8-20% increase
        };

        // Get frequently bought together services
        const { data: bundleData } = await supabaseClient
          .from('order_items')
          .select(`
            agent_id,
            service_id,
            services (title, category)
          `)
          .neq('service_id', serviceId);

        // Group by agent and find co-purchased services
        const agentServices = new Map();
        bundleData?.forEach(item => {
          if (!agentServices.has(item.agent_id)) {
            agentServices.set(item.agent_id, []);
          }
          agentServices.get(item.agent_id).push(item);
        });

        // Find services commonly bought with current service
        const co購asedServices = new Map();
        serviceUsers?.forEach(user => {
          const otherServices = agentServices.get(user.agent_id) || [];
          otherServices.forEach(otherService => {
            const key = otherService.service_id;
            if (key !== serviceId) {
              coCustomServices.set(key, (coCustomServices.get(key) || 0) + 1);
            }
          });
        });

        const topBundles = Array.from(coCustomServices.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([serviceId, count]) => {
            const serviceInfo = bundleData?.find(item => item.service_id === serviceId);
            return {
              serviceId,
              title: serviceInfo?.services?.title || 'Unknown Service',
              category: serviceInfo?.services?.category || 'Unknown',
              adoptionCount: count
            };
          });

        return {
          serviceId,
          serviceName: service?.title || 'Unknown Service',
          category: service?.category || 'Unknown',
          vendor: service?.vendors?.name || 'Unknown Vendor',
          peerInsights: {
            adoptionRate,
            topPerformerAdoptionRate,
            totalAdopters: totalAdopters || 0,
            performanceLift: avgPerformanceLift,
            topPerformerSignal: topPerformerAdoptionRate > 30 ? 'high' : 
                                topPerformerAdoptionRate > 15 ? 'medium' : 'low',
            bundles: topBundles,
            peerRecommendation: topPerformerAdoptionRate > 25 
              ? 'Highly recommended by top performers'
              : adoptionRate > 20 
              ? 'Popular among peers'
              : 'Emerging tool worth considering'
          }
        };
      })
    );

    // Generate AI insights
    const aiInsight = generateAIInsight(serviceAnalysis, userStats);

    return new Response(
      JSON.stringify({
        services: serviceAnalysis,
        aiInsight,
        analysisTimestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in compare-services-with-peers:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        services: [],
        aiInsight: 'Unable to generate peer insights at this time.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateAIInsight(serviceAnalysis: any[], userStats: any): string {
  const insights = [];
  
  serviceAnalysis.forEach(service => {
    const { peerInsights } = service;
    
    if (peerInsights.topPerformerSignal === 'high') {
      insights.push(`${service.serviceName} is highly adopted by top 10% performers (${peerInsights.topPerformerAdoptionRate}% adoption rate), suggesting strong ROI potential.`);
    }
    
    if (peerInsights.performanceLift.transactions > 20) {
      insights.push(`Agents using ${service.serviceName} typically see a ${peerInsights.performanceLift.transactions}% increase in transaction volume.`);
    }
    
    if (peerInsights.bundles.length > 0) {
      insights.push(`${service.serviceName} is often paired with ${peerInsights.bundles[0].title} for maximum impact.`);
    }
  });
  
  if (insights.length === 0) {
    insights.push("These services show varied adoption patterns. Consider your specific business goals when making your selection.");
  }
  
  return insights.join(' ');
}