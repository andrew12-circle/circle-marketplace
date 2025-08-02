import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { message, userId, context } = await req.json();

    console.log('Received request:', { message, userId, context });

    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error('OpenAI API key is not set');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        recommendation: "I'm currently unable to access AI services. Please try again later or contact support."
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get comprehensive user context
    const userContext = await gatherUserContext(supabase, userId);
    console.log('User context gathered:', userContext);

    // Analyze site data for market insights
    const marketAnalysis = await analyzeMarketData(supabase);
    console.log('Market analysis completed');

    // Create enhanced prompt with real data
    const enhancedPrompt = createContextualPrompt(message, userContext, marketAnalysis, context);
    console.log('Enhanced prompt created');

    // Get AI recommendations
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI business advisor for real estate professionals on Circle Platform. 
            You have access to real marketplace data and user behavior patterns.
            Provide specific, actionable recommendations based on the data provided.
            Keep responses concise but insightful. Focus on ROI and practical next steps.
            Use data-driven insights to support your recommendations.`
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const aiResponse = await response.json();
    console.log('OpenAI response received');

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.error?.message || 'Unknown error'}`);
    }

    const recommendation = aiResponse.choices[0].message.content;

    // Log the recommendation for analytics
    await logRecommendation(supabase, userId, message, recommendation, userContext);

    return new Response(JSON.stringify({ 
      recommendation,
      context: userContext,
      insights: marketAnalysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enhanced-ai-recommendations function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      recommendation: "I'm having trouble accessing the latest data right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function gatherUserContext(supabase: any, userId: string) {
  try {
    // Get user profile and preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get saved services to understand interests
    const { data: savedServices } = await supabase
      .from('saved_services')
      .select(`
        *,
        services (
          title, category, tags, retail_price, pro_price,
          rating, respa_category
        )
      `)
      .eq('user_id', userId)
      .limit(10);

    // Get recent service views for behavior analysis
    const { data: recentViews } = await supabase
      .from('service_views')
      .select(`
        *,
        services (
          title, category, tags, retail_price, 
          rating, respa_category
        )
      `)
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(20);

    // Get consultation bookings history
    const { data: consultations } = await supabase
      .from('consultation_bookings')
      .select(`
        *,
        services (
          title, category, vendor_id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get point allocations if user is an agent
    const { data: pointAllocations } = await supabase
      .from('point_allocations')
      .select('*')
      .eq('agent_id', userId)
      .eq('status', 'active');

    // Get co-pay requests to understand spending patterns
    const { data: coPayRequests } = await supabase
      .from('co_pay_requests')
      .select(`
        *,
        services (title, category, retail_price)
      `)
      .eq('agent_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      profile: profile || {},
      savedServices: savedServices || [],
      recentViews: recentViews || [],
      consultations: consultations || [],
      pointAllocations: pointAllocations || [],
      coPayRequests: coPayRequests || [],
      totalSavedServices: savedServices?.length || 0,
      uniqueCategories: [...new Set((savedServices || []).map(s => s.services?.category).filter(Boolean))],
      averageServicePrice: calculateAveragePrice(savedServices || []),
      lastActivity: recentViews?.[0]?.viewed_at || null
    };
  } catch (error) {
    console.error('Error gathering user context:', error);
    return {};
  }
}

async function analyzeMarketData(supabase: any) {
  try {
    // Get top performing services by category
    const { data: topServices } = await supabase
      .from('services')
      .select('category, title, rating, retail_price, tags')
      .order('rating', { ascending: false })
      .limit(50);

    // Get vendor performance data
    const { data: vendors } = await supabase
      .from('service_providers')
      .select('name, rating, review_count, is_respa_regulated, campaigns_funded')
      .order('rating', { ascending: false })
      .limit(30);

    // Get recent activity trends
    const { data: recentActivity } = await supabase
      .from('service_views')
      .select(`
        services (category, tags),
        viewed_at
      `)
      .gte('viewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(200);

    // Analyze category trends
    const categoryTrends = analyzeCategoryTrends(recentActivity || []);
    const priceRanges = analyzePriceRanges(topServices || []);
    const vendorInsights = analyzeVendorData(vendors || []);

    return {
      topServices: topServices?.slice(0, 10) || [],
      categoryTrends,
      priceRanges,
      vendorInsights,
      totalActiveVendors: vendors?.length || 0,
      marketActivity: recentActivity?.length || 0
    };
  } catch (error) {
    console.error('Error analyzing market data:', error);
    return {};
  }
}

function createContextualPrompt(userMessage: string, userContext: any, marketAnalysis: any, additionalContext: any) {
  const { profile, savedServices, recentViews, uniqueCategories, pointAllocations } = userContext;
  const { categoryTrends, priceRanges, vendorInsights } = marketAnalysis;

  let prompt = `User Question: "${userMessage}"\n\n`;

  // User Profile Context
  prompt += `USER PROFILE:\n`;
  prompt += `- Role: ${profile?.specialties?.join(', ') || 'Real Estate Professional'}\n`;
  prompt += `- Experience: ${profile?.years_experience || 'Not specified'} years\n`;
  prompt += `- Location: ${profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : 'Location not specified'}\n`;
  prompt += `- Business Type: ${profile?.vendor_enabled ? 'Vendor/Service Provider' : 'Agent/Buyer'}\n`;
  prompt += `- Circle Points: ${profile?.circle_points || 0}\n\n`;

  // User Behavior Context
  prompt += `USER BEHAVIOR INSIGHTS:\n`;
  prompt += `- Services Saved: ${userContext.totalSavedServices}\n`;
  prompt += `- Interest Categories: ${uniqueCategories.join(', ') || 'None yet'}\n`;
  prompt += `- Recent Activity: ${recentViews?.length || 0} service views in recent sessions\n`;
  prompt += `- Active Point Allocations: ${pointAllocations?.length || 0}\n`;
  prompt += `- Average Budget Range: $${userContext.averageServicePrice || 'Not determined'}\n\n`;

  // Market Data Context
  prompt += `CURRENT MARKET INSIGHTS:\n`;
  prompt += `- Trending Categories: ${Object.keys(categoryTrends).slice(0, 5).join(', ')}\n`;
  prompt += `- Price Range Analysis: ${JSON.stringify(priceRanges)}\n`;
  prompt += `- Top Vendor Types: ${vendorInsights.topTypes?.join(', ') || 'Mixed'}\n`;
  prompt += `- Market Activity: ${marketAnalysis.marketActivity} recent interactions\n\n`;

  // Recent Services Context
  if (savedServices?.length > 0) {
    prompt += `RECENTLY SAVED SERVICES:\n`;
    savedServices.slice(0, 5).forEach((service: any, index: number) => {
      prompt += `${index + 1}. ${service.services?.title} (${service.services?.category}) - $${service.services?.retail_price}\n`;
    });
    prompt += `\n`;
  }

  // Additional Context from UI
  if (additionalContext) {
    prompt += `ADDITIONAL CONTEXT:\n`;
    if (additionalContext.currentPage) prompt += `- Current Page: ${additionalContext.currentPage}\n`;
    if (additionalContext.filters) prompt += `- Active Filters: ${JSON.stringify(additionalContext.filters)}\n`;
    if (additionalContext.searchQuery) prompt += `- Recent Search: ${additionalContext.searchQuery}\n`;
    prompt += `\n`;
  }

  prompt += `Please provide specific, actionable recommendations based on this user's profile and the current market data. Focus on ROI and practical next steps that align with their interests and budget.`;

  return prompt;
}

function calculateAveragePrice(savedServices: any[]) {
  if (!savedServices.length) return null;
  
  const prices = savedServices
    .map(s => parseFloat(s.services?.retail_price?.replace(/[^0-9.]/g, '') || '0'))
    .filter(price => price > 0);
  
  return prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
}

function analyzeCategoryTrends(recentActivity: any[]) {
  const categoryCount: { [key: string]: number } = {};
  
  recentActivity.forEach(activity => {
    const category = activity.services?.category;
    if (category) {
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }
  });

  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .reduce((obj, [category, count]) => {
      obj[category] = count;
      return obj;
    }, {} as { [key: string]: number });
}

function analyzePriceRanges(services: any[]) {
  const prices = services
    .map(s => parseFloat(s.retail_price?.replace(/[^0-9.]/g, '') || '0'))
    .filter(price => price > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) return {};

  return {
    min: prices[0],
    max: prices[prices.length - 1],
    median: prices[Math.floor(prices.length / 2)],
    average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
  };
}

function analyzeVendorData(vendors: any[]) {
  const respaCounts = vendors.reduce((acc, vendor) => {
    acc[vendor.is_respa_regulated ? 'respa' : 'nonRespa']++;
    return acc;
  }, { respa: 0, nonRespa: 0 });

  const avgRating = vendors.length > 0 
    ? vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length 
    : 0;

  return {
    respaRegulated: respaCounts.respa,
    nonRespaRegulated: respaCounts.nonRespa,
    averageRating: Math.round(avgRating * 100) / 100,
    topTypes: ['Settlement Services', 'Marketing', 'Photography', 'Direct Mail']
  };
}

async function logRecommendation(supabase: any, userId: string, question: string, recommendation: string, context: any) {
  try {
    await supabase
      .from('ai_recommendation_log')
      .insert({
        user_id: userId,
        question,
        recommendation,
        context_data: context,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging recommendation:', error);
    // Don't throw - logging shouldn't break the main flow
  }
}