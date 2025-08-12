import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { userId, location, specialties } = await req.json();

    console.log('Gathering market intelligence for:', { userId, location, specialties });

    // Gather comprehensive market intelligence
    const marketData = await gatherMarketIntelligence(supabase, location, specialties);
    
    // Analyze vendor relationship opportunities
    const vendorOpportunities = await analyzeVendorOpportunities(supabase, userId, location);
    
    // Get ROI insights from similar agents
    const roiInsights = await getRoiInsights(supabase, location, specialties);

    // Calculate market competitiveness scores
    const competitivenessData = await analyzeMarketCompetitiveness(supabase, location, specialties);

    const intelligence = {
      marketData,
      vendorOpportunities,
      roiInsights,
      competitivenessData,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(intelligence), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-market-intelligence function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function gatherMarketIntelligence(supabase: any, location: string, specialties: string[]) {
  try {
    // Get local market activity
    const { data: localActivity } = await supabase
      .from('service_views')
      .select(`
        services (
          id, title, category, retail_price, rating,
          service_providers (name, location, is_respa_regulated)
        )
      `)
      .ilike('services.service_providers.location', `%${location}%`)
      .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(100);

    // Get trending services in user's specialties
    const { data: trendingServices } = await supabase
      .from('services')
      .select('id, title, category, retail_price, rating, tags')
      .in('category', specialties)
      .order('rating', { ascending: false })
      .limit(20);

    // Get price trends
    const priceTrends = analyzeLocalPriceTrends(localActivity || []);
    
    // Get vendor density by category
    const vendorDensity = analyzeVendorDensity(localActivity || []);

    return {
      localActivity: localActivity?.length || 0,
      trendingServices: trendingServices || [],
      priceTrends,
      vendorDensity,
      marketSize: calculateMarketSize(localActivity || [])
    };
  } catch (error) {
    console.error('Error gathering market intelligence:', error);
    return {};
  }
}

async function analyzeVendorOpportunities(supabase: any, userId: string, location: string) {
  try {
    // Get vendors offering co-pay in user's area
    const { data: coPayVendors } = await supabase
      .from('vendors')
      .select(`
        id, business_name, location, circle_commission_percentage,
        co_marketing_agents, sort_order,
        services (count)
      `)
      .ilike('location', `%${location}%`)
      .gt('circle_commission_percentage', 0)
      .order('circle_commission_percentage', { ascending: false })
      .limit(15);

    // Get vendor performance data
    const vendorPerformance = await analyzeVendorPerformance(supabase, coPayVendors || []);

    // Get co-pay success rates
    const { data: coPayStats } = await supabase
      .from('co_pay_requests')
      .select('vendor_id, status, requested_split_percentage')
      .in('vendor_id', (coPayVendors || []).map(v => v.id))
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    return {
      availableVendors: coPayVendors || [],
      vendorPerformance,
      coPaySuccessRates: calculateCoPaySuccessRates(coPayStats || []),
      opportunityScore: calculateOpportunityScore(coPayVendors || [], coPayStats || [])
    };
  } catch (error) {
    console.error('Error analyzing vendor opportunities:', error);
    return {};
  }
}

async function getRoiInsights(supabase: any, location: string, specialties: string[]) {
  try {
    // Get ROI data from similar successful agents
    const { data: roiData } = await supabase
      .from('service_outcome_tracking')
      .select(`
        service_id, outcome_type, outcome_value, roi_percentage,
        agent_profiles (location, specialties, years_experience)
      `)
      .contains('agent_profiles.specialties', specialties)
      .ilike('agent_profiles.location', `%${location}%`)
      .gt('roi_percentage', 0)
      .gte('tracked_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      .limit(50);

    // Calculate average ROI by service category
    const roiByCategory = calculateRoiByCategory(roiData || []);
    
    // Get high-performing service combinations
    const serviceCombinations = analyzeServiceCombinations(roiData || []);

    return {
      averageRoiByCategory: roiByCategory,
      topPerformingServices: (roiData || []).slice(0, 10),
      serviceCombinations,
      sampleSize: roiData?.length || 0
    };
  } catch (error) {
    console.error('Error getting ROI insights:', error);
    return {};
  }
}

async function analyzeMarketCompetitiveness(supabase: any, location: string, specialties: string[]) {
  try {
    // Get agent density in the area
    const { data: localAgents } = await supabase
      .from('profiles')
      .select('user_id, specialties, years_experience')
      .ilike('location', `%${location}%`)
      .overlaps('specialties', specialties);

    // Get service saturation by category
    const { data: localServices } = await supabase
      .from('services')
      .select('category, service_providers!inner(location)')
      .ilike('service_providers.location', `%${location}%`)
      .in('category', specialties);

    const competitivenessScore = calculateCompetitivenessScore(
      localAgents?.length || 0,
      localServices?.length || 0,
      specialties.length
    );

    return {
      agentDensity: localAgents?.length || 0,
      serviceDensity: localServices?.length || 0,
      competitivenessScore,
      marketOpportunity: competitivenessScore < 0.6 ? 'high' : competitivenessScore < 0.8 ? 'medium' : 'low'
    };
  } catch (error) {
    console.error('Error analyzing market competitiveness:', error);
    return {};
  }
}

// Helper functions
function analyzeLocalPriceTrends(activities: any[]) {
  const prices = activities
    .map(a => parseFloat(a.services?.retail_price?.replace(/[^0-9.]/g, '') || '0'))
    .filter(price => price > 0);

  if (prices.length === 0) return {};

  prices.sort((a, b) => a - b);
  return {
    min: prices[0],
    max: prices[prices.length - 1],
    median: prices[Math.floor(prices.length / 2)],
    average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
  };
}

function analyzeVendorDensity(activities: any[]) {
  const categoryCount: { [key: string]: Set<string> } = {};
  
  activities.forEach(activity => {
    const category = activity.services?.category;
    const vendorName = activity.services?.service_providers?.name;
    
    if (category && vendorName) {
      if (!categoryCount[category]) {
        categoryCount[category] = new Set();
      }
      categoryCount[category].add(vendorName);
    }
  });

  const result: { [key: string]: number } = {};
  Object.keys(categoryCount).forEach(category => {
    result[category] = categoryCount[category].size;
  });

  return result;
}

function calculateMarketSize(activities: any[]) {
  const uniqueServices = new Set(activities.map(a => a.services?.id)).size;
  const uniqueVendors = new Set(activities.map(a => a.services?.service_providers?.name)).size;
  
  return {
    uniqueServices,
    uniqueVendors,
    totalActivity: activities.length
  };
}

async function analyzeVendorPerformance(supabase: any, vendors: any[]) {
  try {
    const performanceData: { [key: string]: any } = {};
    
    for (const vendor of vendors) {
      const { data: reviews } = await supabase
        .from('service_reviews')
        .select('rating')
        .eq('vendor_id', vendor.id)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      const avgRating = reviews?.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      performanceData[vendor.id] = {
        averageRating: Math.round(avgRating * 100) / 100,
        reviewCount: reviews?.length || 0,
        commissionRate: vendor.circle_commission_percentage,
        agentCount: vendor.co_marketing_agents
      };
    }

    return performanceData;
  } catch (error) {
    console.error('Error analyzing vendor performance:', error);
    return {};
  }
}

function calculateCoPaySuccessRates(coPayStats: any[]) {
  const vendorStats: { [key: string]: { total: number; approved: number } } = {};

  coPayStats.forEach(stat => {
    if (!vendorStats[stat.vendor_id]) {
      vendorStats[stat.vendor_id] = { total: 0, approved: 0 };
    }
    vendorStats[stat.vendor_id].total++;
    if (stat.status === 'approved' || stat.status === 'final_approved') {
      vendorStats[stat.vendor_id].approved++;
    }
  });

  const result: { [key: string]: number } = {};
  Object.keys(vendorStats).forEach(vendorId => {
    const stats = vendorStats[vendorId];
    result[vendorId] = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
  });

  return result;
}

function calculateOpportunityScore(vendors: any[], coPayStats: any[]) {
  const vendorCount = vendors.length;
  const avgCommission = vendors.length > 0 
    ? vendors.reduce((sum, v) => sum + v.circle_commission_percentage, 0) / vendors.length 
    : 0;
  const totalCoPayRequests = coPayStats.length;

  // Score based on vendor availability, commission rates, and activity
  const baseScore = Math.min(vendorCount / 10, 1) * 0.4; // Up to 40% for vendor availability
  const commissionScore = Math.min(avgCommission / 15, 1) * 0.3; // Up to 30% for commission rates
  const activityScore = Math.min(totalCoPayRequests / 50, 1) * 0.3; // Up to 30% for market activity

  return Math.round((baseScore + commissionScore + activityScore) * 100) / 100;
}

function calculateRoiByCategory(roiData: any[]) {
  const categoryRoi: { [key: string]: number[] } = {};

  roiData.forEach(item => {
    const category = item.service_category || 'other';
    if (!categoryRoi[category]) {
      categoryRoi[category] = [];
    }
    if (item.roi_percentage > 0) {
      categoryRoi[category].push(item.roi_percentage);
    }
  });

  const result: { [key: string]: number } = {};
  Object.keys(categoryRoi).forEach(category => {
    const rois = categoryRoi[category];
    result[category] = rois.length > 0 
      ? Math.round(rois.reduce((sum, roi) => sum + roi, 0) / rois.length) 
      : 0;
  });

  return result;
}

function analyzeServiceCombinations(roiData: any[]) {
  // Simplified analysis - in real implementation, this would be more sophisticated
  return roiData
    .filter(item => item.roi_percentage > 150)
    .slice(0, 5)
    .map(item => ({
      serviceId: item.service_id,
      roiPercentage: item.roi_percentage,
      outcomeType: item.outcome_type
    }));
}

function calculateCompetitivenessScore(agentCount: number, serviceCount: number, specialtyCount: number) {
  // Simple competitiveness calculation
  const agentDensity = agentCount / 1000; // Per 1000 population (simplified)
  const serviceDensity = serviceCount / agentCount || 0;
  const specialtyFactor = Math.min(specialtyCount / 3, 1);

  const score = (agentDensity * 0.4) + (serviceDensity * 0.4) + (specialtyFactor * 0.2);
  return Math.min(Math.round(score * 100) / 100, 1);
}