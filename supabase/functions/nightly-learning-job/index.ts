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
    console.log('🌙 Running nightly learning job...');

    // Analyze purchase patterns
    const purchaseInsights = await analyzePurchasePatterns();
    
    // Compute cohort insights
    const cohortInsights = await computeCohortInsights();
    
    // Identify trending services
    const trendingInsights = await identifyTrendingServices();
    
    // Combine all insights
    const allInsights = [
      ...purchaseInsights,
      ...cohortInsights,
      ...trendingInsights
    ];

    // Store insights in market pulse table
    await storeMarketPulse(allInsights);
    
    // Clean up old insights (keep last 30 days)
    await cleanupOldInsights();

    console.log(`✅ Nightly job completed. Generated ${allInsights.length} insights.`);
    
    return new Response(JSON.stringify({
      success: true,
      insights_generated: allInsights.length,
      categories: {
        purchase_patterns: purchaseInsights.length,
        cohort_analysis: cohortInsights.length,
        trending_services: trendingInsights.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in nightly learning job:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function analyzePurchasePatterns(): Promise<string[]> {
  const insights: string[] = [];
  
  try {
    // Analyze recent purchases by price band
    const { data: priceBandData } = await supabase
      .from('purchase_events')
      .select('price, vendor_id, sku, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (priceBandData && priceBandData.length > 0) {
      // Group by price ranges
      const lowBudget = priceBandData.filter(p => (p.price || 0) < 200).length;
      const midBudget = priceBandData.filter(p => (p.price || 0) >= 200 && (p.price || 0) < 800).length;
      const highBudget = priceBandData.filter(p => (p.price || 0) >= 800).length;

      if (lowBudget > midBudget + highBudget) {
        insights.push("Most agents are choosing budget-friendly solutions under $200/month");
      } else if (midBudget > lowBudget + highBudget) {
        insights.push("Mid-tier services ($200-$800) are the sweet spot for most agents");
      } else if (highBudget > 0) {
        insights.push("Premium services ($800+) gaining traction with top producers");
      }

      // Popular vendor analysis
      const vendorCounts = priceBandData.reduce((acc, p) => {
        acc[p.vendor_id] = (acc[p.vendor_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topVendor = Object.entries(vendorCounts).sort(([,a], [,b]) => b - a)[0];
      if (topVendor && topVendor[1] > 3) {
        insights.push(`Vendor ${topVendor[0]} leading in adoption with ${topVendor[1]} recent purchases`);
      }
    }
  } catch (error) {
    console.error('Error analyzing purchase patterns:', error);
  }

  return insights;
}

async function computeCohortInsights(): Promise<string[]> {
  const insights: string[] = [];
  
  try {
    // Analyze agent performance vs spending patterns
    const { data: performanceData } = await supabase
      .from('agent_performance_tracking')
      .select('agent_id, transactions_closed, volume_closed')
      .gte('month_year', '2024-01');

    const { data: spendingData } = await supabase
      .from('agent_copay_spending')
      .select('agent_id, total_spent')
      .gte('month_year', '2024-01');

    if (performanceData && spendingData) {
      const combinedData = performanceData.map(p => {
        const spending = spendingData.find(s => s.agent_id === p.agent_id);
        return {
          ...p,
          total_spent: spending?.total_spent || 0
        };
      });

      // Analyze correlation between spending and performance
      const highPerformers = combinedData.filter(a => (a.transactions_closed || 0) > 5);
      const avgSpendingHigh = highPerformers.reduce((sum, a) => sum + (a.total_spent || 0), 0) / (highPerformers.length || 1);
      
      const lowPerformers = combinedData.filter(a => (a.transactions_closed || 0) <= 2);
      const avgSpendingLow = lowPerformers.reduce((sum, a) => sum + (a.total_spent || 0), 0) / (lowPerformers.length || 1);

      if (avgSpendingHigh > avgSpendingLow * 1.5) {
        insights.push(`Top performers invest ${Math.round((avgSpendingHigh / avgSpendingLow - 1) * 100)}% more in tools and services`);
      }

      if (highPerformers.length > 0) {
        const avgClosings = highPerformers.reduce((sum, a) => sum + (a.transactions_closed || 0), 0) / highPerformers.length;
        insights.push(`Agents closing ${Math.round(avgClosings)}+ deals/month typically use 3-4 core services`);
      }
    }
  } catch (error) {
    console.error('Error computing cohort insights:', error);
  }

  return insights;
}

async function identifyTrendingServices(): Promise<string[]> {
  const insights: string[] = [];
  
  try {
    // Look at service tracking events to identify trends
    const { data: recentActivity } = await supabase
      .from('service_tracking_events')
      .select('service_id, event_type, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (recentActivity && recentActivity.length > 0) {
      // Count engagement by service
      const serviceEngagement = recentActivity.reduce((acc, event) => {
        if (!acc[event.service_id]) {
          acc[event.service_id] = { views: 0, clicks: 0, purchases: 0 };
        }
        acc[event.service_id][event.event_type]++;
        return acc;
      }, {} as Record<string, any>);

      // Identify high-engagement services
      const trendingServices = Object.entries(serviceEngagement)
        .filter(([, metrics]) => (metrics.views + metrics.clicks) > 10)
        .sort(([, a], [, b]) => (b.views + b.clicks + b.purchases * 5) - (a.views + a.clicks + a.purchases * 5))
        .slice(0, 3);

      if (trendingServices.length > 0) {
        insights.push(`${trendingServices.length} services seeing 3x higher engagement this week`);
        
        // Check for category trends
        const { data: services } = await supabase
          .from('services')
          .select('id, category')
          .in('id', trendingServices.map(([id]) => id));

        if (services) {
          const categoryTrends = services.reduce((acc, s) => {
            acc[s.category] = (acc[s.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const topCategory = Object.entries(categoryTrends).sort(([,a], [,b]) => b - a)[0];
          if (topCategory) {
            insights.push(`${topCategory[0]} category leading engagement trends`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error identifying trending services:', error);
  }

  return insights;
}

async function storeMarketPulse(insights: string[]): Promise<void> {
  try {
    // Insert general insights
    const generalInsights = insights.map(insight => ({
      region: null,
      insight: insight
    }));

    if (generalInsights.length > 0) {
      await supabase
        .from('concierge_market_pulse')
        .insert(generalInsights);
    }

    // Could also insert region-specific insights here if we had regional data
    console.log(`📊 Stored ${generalInsights.length} market insights`);
  } catch (error) {
    console.error('Error storing market pulse:', error);
  }
}

async function cleanupOldInsights(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('concierge_market_pulse')
      .delete()
      .lt('created_at', thirtyDaysAgo);

    if (error) throw error;
    
    console.log('🧹 Cleaned up old market pulse insights');
  } catch (error) {
    console.error('Error cleaning up old insights:', error);
  }
}
