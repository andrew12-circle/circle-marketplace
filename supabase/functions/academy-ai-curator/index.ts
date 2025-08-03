import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, performanceData, context } = await req.json();
    
    console.log('Academy AI Curator request:', { userId, performanceData, context });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gather user context and academy content
    const [userProfile, allContent] = await Promise.all([
      gatherUserProfile(supabase, userId),
      gatherAcademyContent(supabase)
    ]);

    console.log('Gathered data:', { 
      userProfile: userProfile ? 'found' : 'not found',
      contentCount: allContent.length 
    });

    // Analyze performance gap
    const performanceGap = analyzePerformanceGap(performanceData);
    
    // Generate learning path using AI if available, otherwise use rule-based approach
    let learningPath;
    
    if (openAIApiKey) {
      console.log('Using OpenAI for content curation');
      learningPath = await generateAILearningPath(
        userProfile,
        performanceData,
        performanceGap,
        allContent,
        openAIApiKey
      );
    } else {
      console.log('Using rule-based content curation');
      learningPath = generateRuleBasedLearningPath(
        performanceData,
        performanceGap,
        allContent
      );
    }

    // Log the recommendation
    await logCurationActivity(supabase, userId, performanceData, learningPath);

    return new Response(
      JSON.stringify({ learningPath }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in academy-ai-curator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function gatherUserProfile(supabase: any, userId: string) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get user's content interactions
    const { data: interactions } = await supabase
      .from('content_interactions')
      .select('*, content!inner(*)')
      .eq('user_id', userId)
      .limit(50);

    // Get user's saved content
    const { data: savedContent } = await supabase
      .from('content_ratings')
      .select('*, content!inner(*)')
      .eq('user_id', userId)
      .gte('rating', 4)
      .limit(20);

    return {
      profile,
      interactions: interactions || [],
      savedContent: savedContent || []
    };
  } catch (error) {
    console.error('Error gathering user profile:', error);
    return null;
  }
}

async function gatherAcademyContent(supabase: any) {
  try {
    const { data: content } = await supabase
      .from('content')
      .select(`
        id, title, description, content_type, category, tags, 
        duration, rating, price, is_featured, is_pro, 
        target_audience, metadata, creator_id,
        profiles!content_creator_id_fkey(display_name)
      `)
      .eq('is_published', true)
      .order('rating', { ascending: false })
      .limit(100);

    return content || [];
  } catch (error) {
    console.error('Error gathering academy content:', error);
    return [];
  }
}

function analyzePerformanceGap(performanceData: any) {
  const { currentDeals, targetDeals, timeframe } = performanceData;
  
  const dealsGap = targetDeals - currentDeals;
  const growthRate = (dealsGap / currentDeals) * 100;
  const monthlyGrowthNeeded = dealsGap / timeframe;
  
  let difficulty = 'moderate';
  if (growthRate > 200) difficulty = 'challenging';
  else if (growthRate < 50) difficulty = 'achievable';
  
  let focusAreas = [];
  if (currentDeals < 10) {
    focusAreas = ['lead_generation', 'basics', 'prospecting', 'mindset'];
  } else if (currentDeals < 25) {
    focusAreas = ['conversion', 'systems', 'marketing', 'scaling'];
  } else {
    focusAreas = ['team_building', 'luxury_market', 'automation', 'advanced_strategies'];
  }

  return {
    dealsGap,
    growthRate,
    monthlyGrowthNeeded,
    difficulty,
    focusAreas
  };
}

async function generateAILearningPath(
  userProfile: any,
  performanceData: any,
  performanceGap: any,
  allContent: any[],
  apiKey: string
) {
  try {
    const prompt = createLearningPathPrompt(userProfile, performanceData, performanceGap, allContent);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert real estate education curator. Create personalized learning paths that help agents bridge performance gaps. Focus on practical, actionable content that directly addresses their specific needs.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    const aiData = await response.json();
    const aiRecommendation = aiData.choices[0].message.content;
    
    // Parse AI response and combine with rule-based content selection
    const ruleBasedPath = generateRuleBasedLearningPath(performanceData, performanceGap, allContent);
    
    return enhanceLearningPathWithAI(ruleBasedPath, aiRecommendation, performanceData);
    
  } catch (error) {
    console.error('Error with OpenAI:', error);
    // Fallback to rule-based approach
    return generateRuleBasedLearningPath(performanceData, performanceGap, allContent);
  }
}

function createLearningPathPrompt(userProfile: any, performanceData: any, performanceGap: any, allContent: any[]) {
  return `
Agent Performance Profile:
- Current deals: ${performanceData.currentDeals} in last 12 months
- Target deals: ${performanceData.targetDeals} per year
- Gap to close: ${performanceGap.dealsGap} deals (${Math.round(performanceGap.growthRate)}% growth)
- Timeframe: ${performanceData.timeframe} months
- Challenges: ${performanceData.specificChallenges || 'Not specified'}
- Focus area: ${performanceData.primaryFocus || 'General improvement'}

Based on this performance gap, create a learning path name, description, key skills to focus on, and learning milestones. The agent needs to grow from ${performanceData.currentDeals} to ${performanceData.targetDeals} deals.

Focus areas needed: ${performanceGap.focusAreas.join(', ')}
Difficulty level: ${performanceGap.difficulty}

Please provide:
1. A motivating learning path name
2. A description of how this path will help them reach their goal
3. 4-6 key skills they should focus on
4. 4-6 learning milestones/checkpoints
5. Estimated time to see results

Keep responses practical and specific to real estate.
  `;
}

function generateRuleBasedLearningPath(performanceData: any, performanceGap: any, allContent: any[]) {
  const { currentDeals, targetDeals, timeframe, primaryFocus, specificChallenges } = performanceData;
  
  // Generate path name and description
  const pathName = generatePathName(currentDeals, targetDeals);
  const description = generatePathDescription(currentDeals, targetDeals, timeframe);
  
  // Select relevant content based on performance gap
  const curatedContent = selectRelevantContent(allContent, performanceGap, primaryFocus, specificChallenges);
  
  // Generate key skills and milestones
  const keySkillsToFocus = generateKeySkills(performanceGap.focusAreas, currentDeals);
  const milestones = generateMilestones(currentDeals, targetDeals, timeframe);
  
  return {
    pathName,
    description,
    estimatedTimeToGoal: `${Math.round(timeframe * 0.8)} months to see significant improvement`,
    totalContent: curatedContent.length,
    content: curatedContent,
    keySkillsToFocus,
    milestones
  };
}

function generatePathName(currentDeals: number, targetDeals: number) {
  const growth = targetDeals - currentDeals;
  
  if (currentDeals < 5) return "Foundation Builder: Your First 10+ Deals";
  if (currentDeals < 15) return `Scale Smart: From ${currentDeals} to ${targetDeals} Deals`;
  if (currentDeals < 30) return `Production Pro: Breaking Through to ${targetDeals} Deals`;
  return `Elite Performance: Mastering ${targetDeals}+ Deal Volume`;
}

function generatePathDescription(currentDeals: number, targetDeals: number, timeframe: number) {
  const growth = targetDeals - currentDeals;
  return `A curated learning journey designed to help you grow from ${currentDeals} to ${targetDeals} deals over ${timeframe} months. This path focuses on the specific skills and strategies proven to drive consistent transaction growth at your level.`;
}

function selectRelevantContent(allContent: any[], performanceGap: any, primaryFocus: string, specificChallenges: string) {
  // Score and rank content based on relevance
  const scoredContent = allContent.map(content => {
    let relevanceScore = 0;
    
    // Base score from rating
    relevanceScore += (content.rating || 0) * 10;
    
    // Score based on focus areas
    performanceGap.focusAreas.forEach((area: string) => {
      if (content.category?.toLowerCase().includes(area) || 
          content.tags?.some((tag: string) => tag.toLowerCase().includes(area))) {
        relevanceScore += 20;
      }
    });
    
    // Score based on primary focus
    if (primaryFocus && (
      content.title.toLowerCase().includes(primaryFocus.toLowerCase()) ||
      content.description?.toLowerCase().includes(primaryFocus.toLowerCase()) ||
      content.category?.toLowerCase().includes(primaryFocus.toLowerCase())
    )) {
      relevanceScore += 15;
    }
    
    // Score based on specific challenges mentioned
    if (specificChallenges && (
      content.title.toLowerCase().includes(specificChallenges.toLowerCase()) ||
      content.description?.toLowerCase().includes(specificChallenges.toLowerCase())
    )) {
      relevanceScore += 25;
    }
    
    // Prefer featured content
    if (content.is_featured) relevanceScore += 5;
    
    return {
      ...content,
      relevanceScore,
      reason: generateContentReason(content, performanceGap, primaryFocus)
    };
  });
  
  // Sort by relevance and select top content
  const topContent = scoredContent
    .filter(content => content.relevanceScore > 10)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 12);
  
  // Transform to expected format
  return topContent.map(content => ({
    id: content.id,
    title: content.title,
    type: mapContentType(content.content_type),
    creator: content.profiles?.display_name || 'Unknown Creator',
    duration: content.duration,
    rating: content.rating,
    description: content.description || '',
    relevanceScore: content.relevanceScore,
    reason: content.reason,
    category: content.category,
    thumbnail: content.metadata?.thumbnail,
    isProContent: content.is_pro
  }));
}

function mapContentType(contentType: string) {
  switch (contentType) {
    case 'video': return 'video';
    case 'video_short': return 'video';
    case 'podcast': return 'podcast';
    case 'book': return 'book';
    case 'course': return 'course';
    default: return 'video';
  }
}

function generateContentReason(content: any, performanceGap: any, primaryFocus: string) {
  const reasons = [];
  
  if (content.rating && content.rating > 4.5) {
    reasons.push("Highly rated by other agents");
  }
  
  performanceGap.focusAreas.forEach((area: string) => {
    if (content.category?.toLowerCase().includes(area)) {
      reasons.push(`Addresses your ${area.replace('_', ' ')} development needs`);
    }
  });
  
  if (primaryFocus && content.title.toLowerCase().includes(primaryFocus.toLowerCase())) {
    reasons.push(`Directly targets your focus area: ${primaryFocus}`);
  }
  
  if (content.is_featured) {
    reasons.push("Recommended by our academy team");
  }
  
  return reasons.length > 0 ? reasons[0] : "Relevant to your current growth stage";
}

function generateKeySkills(focusAreas: string[], currentDeals: number) {
  const skillMap: { [key: string]: string[] } = {
    lead_generation: ["Prospecting systems", "Lead nurturing", "Database management"],
    basics: ["Client communication", "Transaction coordination", "Market knowledge"],
    prospecting: ["Cold calling", "Social media outreach", "Networking strategies"],
    mindset: ["Goal setting", "Time management", "Confidence building"],
    conversion: ["Closing techniques", "Objection handling", "Negotiation skills"],
    systems: ["CRM utilization", "Process automation", "Follow-up systems"],
    marketing: ["Content creation", "Brand building", "Digital marketing"],
    scaling: ["Lead conversion optimization", "Referral systems", "Market expansion"],
    team_building: ["Agent recruitment", "Team leadership", "Delegation"],
    luxury_market: ["High-end client service", "Luxury marketing", "Premium pricing"],
    automation: ["Technology integration", "Workflow optimization", "Efficiency systems"],
    advanced_strategies: ["Investment strategies", "Market analysis", "Advanced negotiation"]
  };
  
  let skills: string[] = [];
  focusAreas.forEach(area => {
    if (skillMap[area]) {
      skills.push(...skillMap[area]);
    }
  });
  
  // Remove duplicates and limit to 6
  return [...new Set(skills)].slice(0, 6);
}

function generateMilestones(currentDeals: number, targetDeals: number, timeframe: number) {
  const growth = targetDeals - currentDeals;
  const monthlyTarget = growth / timeframe;
  
  const milestones = [
    "Complete foundation learning modules",
    `Implement new systems and processes`,
    `Achieve ${Math.round(currentDeals + (growth * 0.3))} deals milestone`,
    `Optimize and refine your approach`,
    `Reach ${Math.round(currentDeals + (growth * 0.7))} deals milestone`,
    `Master advanced strategies for consistent ${targetDeals}+ production`
  ];
  
  return milestones.slice(0, 5);
}

function enhanceLearningPathWithAI(ruleBasedPath: any, aiRecommendation: string, performanceData: any) {
  try {
    // Try to extract structured data from AI response
    const aiLines = aiRecommendation.split('\n').filter(line => line.trim());
    
    // Look for path name in AI response
    const pathNameMatch = aiLines.find(line => 
      line.toLowerCase().includes('path name') || 
      line.toLowerCase().includes('learning path')
    );
    
    if (pathNameMatch) {
      ruleBasedPath.pathName = pathNameMatch.replace(/^[^:]*:/, '').trim();
    }
    
    // Look for description in AI response
    const descMatch = aiLines.find(line => 
      line.toLowerCase().includes('description') || 
      line.toLowerCase().includes('help')
    );
    
    if (descMatch) {
      ruleBasedPath.description = descMatch.replace(/^[^:]*:/, '').trim();
    }
    
    return ruleBasedPath;
  } catch (error) {
    console.error('Error enhancing with AI:', error);
    return ruleBasedPath;
  }
}

async function logCurationActivity(supabase: any, userId: string, performanceData: any, learningPath: any) {
  try {
    await supabase
      .from('ai_recommendation_log')
      .insert({
        user_id: userId,
        question: `Academy curation: ${performanceData.currentDeals} to ${performanceData.targetDeals} deals`,
        recommendation: `Generated learning path: ${learningPath.pathName}`,
        context_data: {
          performance_data: performanceData,
          content_count: learningPath.totalContent,
          path_name: learningPath.pathName
        }
      });
  } catch (error) {
    console.error('Error logging curation activity:', error);
  }
}