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

    // Get curated AI knowledge for services
    const curatedKnowledge = await getCuratedServiceKnowledge(supabase, message, userContext);
    console.log('Curated knowledge fetched:', curatedKnowledge?.length || 0, 'entries');

    // Create sanitized prompt (no proprietary data to OpenAI)
    const sanitizedPrompt = createSanitizedPrompt(message, userContext, marketAnalysis, context);
    
    // Generate local recommendation based on your data with curated knowledge
    const localRecommendation = generateLocalRecommendation(userContext, marketAnalysis, curatedKnowledge);
    console.log('Local recommendation generated');

    // Enhanced prompt created

    
    let finalRecommendation;
    
    // If we have strong local data, use it primarily
    if (localRecommendation.confidence > 0.7) {
      finalRecommendation = localRecommendation.recommendation;
      console.log('Using local recommendation due to high confidence');
    } else {
      // Only send generic, non-proprietary data to OpenAI for general advice
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
              content: `You are a friendly real estate concierge who provides brief, helpful advice.
              
              RESPONSE RULES:
              - Keep responses to 2-3 sentences maximum
              - Be conversational and helpful
              - Focus on practical, actionable advice
              - Don't reference specific vendor names or prices
              - End with a relevant follow-up question if appropriate
              
              Provide concise business growth advice based on the context provided.`
            },
            {
              role: 'user',
              content: sanitizedPrompt
            }
          ],
          max_completion_tokens: 150, // Enforce brevity
        }),
      });

      const aiResponse = await response.json();
      console.log('OpenAI response received (sanitized)');

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${aiResponse.error?.message || 'Unknown error'}`);
      }

      const genericAdvice = aiResponse.choices[0].message.content;
      
      // Combine generic advice with local marketplace recommendations
      finalRecommendation = combineRecommendations(genericAdvice, localRecommendation.recommendation);
    }

    // Log the recommendation for analytics (keeping your data local)
    await logRecommendation(supabase, userId, message, finalRecommendation, userContext);

    return new Response(JSON.stringify({ 
      recommendation: finalRecommendation,
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
          id, title, category, tags, retail_price, pro_price,
          rating, respa_category, vendor_id
        )
      `)
      .eq('user_id', userId)
      .limit(10);

    // Get purchase patterns of similar users (same location/specialty)
    const { data: similarUserPurchases } = await supabase
      .from('consultation_bookings')
      .select(`
        services (
          id, title, category, retail_price, rating,
          service_providers (name, location)
        )
      `)
      .in('user_id', await getSimilarUsers(supabase, profile))
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(20);

    // Get trending services in user's categories
    const { data: trendingInCategories } = await supabase
      .from('service_views')
      .select(`
        services (
          id, title, category, retail_price, rating,
          tags, service_providers (name, location)
        )
      `)
      .in('services.category', profile?.specialties || ['marketing'])
      .gte('viewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(15);

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
      similarUserPurchases: similarUserPurchases || [],
      trendingInCategories: trendingInCategories || [],
      totalSavedServices: savedServices?.length || 0,
      uniqueCategories: [...new Set((savedServices || []).map(s => s.services?.category).filter(Boolean))],
      averageServicePrice: calculateAveragePrice(savedServices || []),
      lastActivity: recentViews?.[0]?.viewed_at || null,
      purchasingPower: calculatePurchasingPower(pointAllocations || [], profile?.circle_points || 0)
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
  const { profile, savedServices, recentViews, uniqueCategories, pointAllocations, similarUserPurchases, trendingInCategories, purchasingPower } = userContext;
  const { categoryTrends, priceRanges, vendorInsights } = marketAnalysis;

  let prompt = `User Question: "${userMessage}"\n\n`;

  // User Profile Context
  prompt += `AGENT PROFILE:\n`;
  prompt += `- Role: ${profile?.specialties?.join(', ') || 'Real Estate Professional'}\n`;
  prompt += `- Experience: ${profile?.years_experience || 'Not specified'} years\n`;
  prompt += `- Market: ${profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : 'Location not specified'}\n`;
  prompt += `- Business Type: ${profile?.vendor_enabled ? 'Vendor/Service Provider' : 'Agent/Buyer'}\n`;
  prompt += `- Available Budget: ${purchasingPower.total} points ($${purchasingPower.total} value)\n`;
  prompt += `- Active Allocations: ${purchasingPower.activeAllocations} vendors\n\n`;

  // User Behavior Context
  prompt += `USER BEHAVIOR INSIGHTS:\n`;
  prompt += `- Services Saved: ${userContext.totalSavedServices}\n`;
  prompt += `- Interest Categories: ${uniqueCategories.join(', ') || 'None yet'}\n`;
  prompt += `- Recent Activity: ${recentViews?.length || 0} service views in recent sessions\n`;
  prompt += `- Active Point Allocations: ${pointAllocations?.length || 0}\n`;
  prompt += `- Average Budget Range: $${userContext.averageServicePrice || 'Not determined'}\n\n`;

  // Market Data Context
  prompt += `CURRENT MARKET INSIGHTS:\n`;
  const trendingCategories = Object.keys(categoryTrends || {}).slice(0, 5);
  prompt += `- Trending Categories: ${trendingCategories.length > 0 ? trendingCategories.join(', ') : 'Marketing, Lead Generation, CRM'}\n`;
  prompt += `- Price Range Analysis: ${JSON.stringify(priceRanges || {})}\n`;
  prompt += `- Top Vendor Types: ${vendorInsights?.topTypes?.join(', ') || 'Marketing, Settlement Services, Photography'}\n`;
  prompt += `- Market Activity: ${marketAnalysis?.marketActivity || 0} recent interactions\n\n`;

    // What Similar Agents Are Buying
  if (similarUserPurchases?.length > 0) {
    prompt += `WHAT SIMILAR AGENTS IN YOUR MARKET ARE BUYING:\n`;
    similarUserPurchases.slice(0, 5).forEach((purchase: any, index: number) => {
      const serviceTitle = purchase.services?.title || 'Unknown Service';
      const retailPrice = purchase.services?.retail_price || 'Price not available';
      const providerName = purchase.services?.service_providers?.name || 'Provider not specified';
      prompt += `${index + 1}. [ID: ${purchase.services?.id || 'N/A'}] ${serviceTitle} - $${retailPrice} (${providerName})\n`;
    });
    prompt += `\n`;
  }

  // Trending in Your Categories
  if (trendingInCategories?.length > 0) {
    prompt += `TRENDING SERVICES IN YOUR SPECIALTIES:\n`;
    const uniqueTrending = trendingInCategories
      .filter((item: any, index: number, self: any) => 
        index === self.findIndex((t: any) => t.services?.id === item.services?.id))
      .slice(0, 5);
    
    uniqueTrending.forEach((trending: any, index: number) => {
      const serviceTitle = trending.services?.title || 'Service Name Unavailable';
      const retailPrice = trending.services?.retail_price || 'Price not available';
      const rating = trending.services?.rating || 'Not rated';
      prompt += `${index + 1}. [ID: ${trending.services?.id || 'N/A'}] ${serviceTitle} - $${retailPrice} (Rating: ${rating})\n`;
    });
    prompt += `\n`;
  }

  // Recently Saved Services
  if (savedServices?.length > 0) {
    prompt += `YOUR SAVED SERVICES (Ready to Purchase):\n`;
    savedServices.slice(0, 3).forEach((service: any, index: number) => {
      prompt += `${index + 1}. [ID: ${service.services?.id}] ${service.services?.title} - $${service.services?.retail_price}\n`;
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

async function getCuratedServiceKnowledge(supabase: any, userMessage: string, userContext: any) {
  try {
    // Get keywords from user message for semantic matching
    const messageKeywords = userMessage.toLowerCase().split(/\s+/);
    
    // Get user's interests from saved services and recent views
    const userCategories = userContext.uniqueCategories || [];
    const userTags = [
      ...(userContext.savedServices?.flatMap((s: any) => s.services?.tags || []) || []),
      ...(userContext.recentViews?.flatMap((v: any) => v.services?.tags || []) || [])
    ].filter(Boolean);

    // Build query to fetch relevant AI knowledge
    let query = supabase
      .from('service_ai_knowledge')
      .select(`
        id, service_id, title, knowledge_type, content, tags, priority,
        services (id, title, category, tags)
      `)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    // Get all active knowledge entries (we'll filter client-side for better matching)
    const { data: allKnowledge } = await query.limit(100);
    
    if (!allKnowledge || allKnowledge.length === 0) {
      return [];
    }

    // Score and filter knowledge entries based on relevance
    const scoredKnowledge = allKnowledge
      .map((entry: any) => {
        let relevanceScore = entry.priority; // Base score from priority
        
        // Boost research entries significantly
        if (entry.knowledge_type === 'research') {
          relevanceScore += 3;
        }
        
        // Boost if message keywords match entry content or tags
        const entryText = `${entry.title} ${entry.content} ${entry.tags?.join(' ') || ''}`.toLowerCase();
        const keywordMatches = messageKeywords.filter(keyword => 
          keyword.length > 3 && entryText.includes(keyword)
        ).length;
        relevanceScore += keywordMatches * 2;
        
        // Boost if user has shown interest in this service category
        if (entry.services?.category && userCategories.includes(entry.services.category)) {
          relevanceScore += 3;
        }
        
        // Boost if user has interacted with similar tagged services
        const commonTags = (entry.tags || []).filter((tag: string) => 
          userTags.some((userTag: string) => 
            userTag.toLowerCase().includes(tag.toLowerCase()) || 
            tag.toLowerCase().includes(userTag.toLowerCase())
          )
        ).length;
        relevanceScore += commonTags * 1.5;
        
        // Boost specific knowledge types for certain queries
        if (userMessage.toLowerCase().includes('roi') && entry.knowledge_type === 'roi_insights') {
          relevanceScore += 2;
        }
        if (userMessage.toLowerCase().includes('implement') && entry.knowledge_type === 'implementation') {
          relevanceScore += 2;
        }
        if (userMessage.toLowerCase().includes('compare') && entry.knowledge_type === 'comparisons') {
          relevanceScore += 2;
        }
        
        return { ...entry, relevanceScore };
      })
      .filter((entry: any) => entry.relevanceScore > 0)
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10); // Top 10 most relevant entries

    console.log('Knowledge entries scored and filtered:', scoredKnowledge.length);
    return scoredKnowledge;
    
  } catch (error) {
    console.error('Error fetching curated service knowledge:', error);
    return [];
  }
}

async function getSimilarUsers(supabase: any, profile: any) {
  if (!profile) return [];
  
  try {
    const { data: similarUsers } = await supabase
      .from('profiles')
      .select('user_id')
      .overlaps('specialties', profile.specialties || [])
      .eq('city', profile.city)
      .eq('state', profile.state)
      .neq('user_id', profile.user_id)
      .limit(20);
    
    return similarUsers?.map(u => u.user_id) || [];
  } catch (error) {
    console.error('Error finding similar users:', error);
    return [];
  }
}

function calculatePurchasingPower(pointAllocations: any[], circlePoints: number) {
  const totalAllocatedPoints = pointAllocations.reduce((sum, allocation) => 
    sum + (allocation.remaining_points || 0), 0);
  
  return {
    total: totalAllocatedPoints + circlePoints,
    allocated: totalAllocatedPoints,
    personal: circlePoints,
    activeAllocations: pointAllocations.length
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

function createSanitizedPrompt(userMessage: string, userContext: any, marketAnalysis: any, additionalContext: any) {
  // Only send generic, non-identifying data to OpenAI
  let prompt = `User Question: "${userMessage}"\n\n`;
  
  prompt += `GENERIC USER PROFILE:\n`;
  prompt += `- Experience Level: ${userContext.profile?.years_experience ? 
    (userContext.profile.years_experience > 5 ? 'Experienced' : 'New') : 'Not specified'}\n`;
  prompt += `- Business Focus: ${userContext.profile?.vendor_enabled ? 'Service Provider' : 'Service Buyer'}\n`;
  prompt += `- General Location: ${userContext.profile?.state ? 'United States' : 'Not specified'}\n\n`;
  
  prompt += `BEHAVIOR PATTERNS:\n`;
  prompt += `- Services Saved: ${userContext.totalSavedServices}\n`;
  prompt += `- General Categories of Interest: ${userContext.uniqueCategories.length} different types\n`;
  prompt += `- Activity Level: ${userContext.recentViews?.length || 0 > 10 ? 'High' : 'Moderate'}\n\n`;
  
  prompt += `MARKET CONTEXT:\n`;
  prompt += `- Total Market Categories: ${Object.keys(marketAnalysis.categoryTrends || {}).length}\n`;
  prompt += `- Market Activity Level: ${marketAnalysis.marketActivity > 100 ? 'High' : 'Moderate'}\n\n`;
  
  prompt += `Please provide general business growth advice for this profile type. Do not reference specific services or vendors.`;
  
  return prompt;
}

function generateLocalRecommendation(userContext: any, marketAnalysis: any, curatedKnowledge: any[] = []) {
  const { profile, savedServices, similarUserPurchases, trendingInCategories, purchasingPower } = userContext;
  
  let recommendation = "";
  let confidence = 0;
  
  // Add curated AI knowledge first if available
  if (curatedKnowledge?.length > 0) {
    recommendation += `\n🧠 **Expert Insights:**\n`;
    
    // Add top 3 most relevant knowledge entries
    curatedKnowledge.slice(0, 3).forEach((entry: any, index: number) => {
      recommendation += `\n**${entry.title}**\n`;
      
      // Add first 150 characters of content + ellipsis if longer
      const content = entry.content.length > 150 
        ? entry.content.substring(0, 150) + '...' 
        : entry.content;
      recommendation += `${content}\n`;
      
      if (entry.services?.title) {
        recommendation += `*Related to: ${entry.services.title} [ID: ${entry.service_id}]*\n`;
      }
    });
    
    recommendation += `\n`;
    confidence += 0.4; // High confidence boost for curated knowledge
  }
  
  // Start with personalized insight
  if (profile?.city && profile?.state) {
    recommendation += `Based on agents in ${profile.city}, ${profile.state} `;
    confidence += 0.2;
  }
  
  // Add trending insights
  if (trendingInCategories?.length > 0) {
    const topTrending = trendingInCategories[0];
    recommendation += `I see ${topTrending.services?.category} services are trending in your market. `;
    confidence += 0.3;
  }
  
  // Add similar user purchase data
  if (similarUserPurchases?.length > 0) {
    const topPurchase = similarUserPurchases[0];
    recommendation += `\n\n🔥 **What similar agents are buying:**\n`;
    recommendation += `• **${topPurchase.services?.title}** - $${topPurchase.services?.retail_price}\n`;
    recommendation += `  Rating: ${topPurchase.services?.rating}/5 | `;
    recommendation += `Provider: ${topPurchase.services?.service_providers?.name}\n`;
    recommendation += `  *[Service ID: ${topPurchase.services?.id} - Click to view]*\n`;
    confidence += 0.4;
  }
  
  // Add saved services ready for purchase
  if (savedServices?.length > 0) {
    recommendation += `\n\n💾 **Your saved services ready to purchase:**\n`;
    savedServices.slice(0, 2).forEach((service: any, index: number) => {
      recommendation += `${index + 1}. **${service.services?.title}** - $${service.services?.retail_price}\n`;
      recommendation += `   *[Service ID: ${service.services?.id} - Ready to buy]*\n`;
    });
    confidence += 0.3;
  }
  
  // Add budget context
  if (purchasingPower.total > 0) {
    recommendation += `\n\n💰 **Your purchasing power:** $${purchasingPower.total} available`;
    if (purchasingPower.activeAllocations > 0) {
      recommendation += ` across ${purchasingPower.activeAllocations} vendor partnerships`;
    }
    confidence += 0.2;
  }
  
  // Fallback if no specific data
  if (confidence < 0.3) {
    recommendation = `I'm analyzing your marketplace activity to provide personalized recommendations. `;
    recommendation += `Save some services you're interested in, and I'll show you what similar agents in your market are buying.`;
    confidence = 0.5; // Medium confidence for fallback
  }
  
  return { recommendation, confidence };
}

function combineRecommendations(genericAdvice: string, localRecommendation: string) {
  return `${localRecommendation}\n\n📈 **Strategic insight:** ${genericAdvice}`;
}