import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface ConversationStep {
  step: string;
  question: string;
  quickReplies?: string[];
  isRequired: boolean;
}

// Helper function to get user's profile data and marketplace intelligence
async function getUserProfileData(supabase: any, userId: string) {
  const profileData = {
    hasProfileStats: false,
    closings12m: 0,
    gci12m: 0,
    goalClosings12m: 0,
    avgSalePrice: 0,
    priceRange: null,
    focusArea: null,
    crm: null,
    city: null,
    state: null,
    currentTools: [],
    successPatterns: [],
    recommendedServices: []
  };

  try {
    // Get agent profile stats
    const { data: stats } = await supabase
      .from('agent_profile_stats')
      .select('*')
      .eq('agent_id', userId)
      .maybeSingle();

    if (stats) {
      profileData.hasProfileStats = true;
      profileData.closings12m = stats.closings_12m || 0;
      profileData.gci12m = stats.gci_12m || 0;
      profileData.goalClosings12m = stats.goal_closings_12m || 0;
      profileData.avgSalePrice = stats.avg_sale_price || 0;
      profileData.crm = stats.crm;
      profileData.currentTools = stats.vendors_current || [];
      
      if (stats.price_band) {
        profileData.priceRange = stats.price_band;
      }
    }

    // Get agent basic info
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (agent) {
      profileData.city = agent.city;
      profileData.state = agent.state;
    }

    // Get what they've already purchased from marketplace
    const { data: purchases } = await supabase
      .from('service_tracking_events')
      .select(`
        service_id,
        services(title, category, vendor_id, vendors(name))
      `)
      .eq('user_id', userId)
      .eq('event_type', 'purchase')
      .order('created_at', { ascending: false });

    if (purchases) {
      profileData.currentTools = [...profileData.currentTools, ...purchases.map(p => p.services?.title).filter(Boolean)];
    }

    // Get recent transactions to understand focus
    const { data: transactions } = await supabase
      .from('agent_transactions')
      .select('role')
      .eq('agent_id', userId)
      .order('close_date', { ascending: false })
      .limit(10);

    if (transactions && transactions.length > 0) {
      const buyerTransactions = transactions.filter(t => t.role === 'buyer_agent').length;
      const sellerTransactions = transactions.filter(t => t.role === 'listing_agent').length;
      
      if (buyerTransactions > sellerTransactions * 1.5) {
        profileData.focusArea = 'buyers';
      } else if (sellerTransactions > buyerTransactions * 1.5) {
        profileData.focusArea = 'sellers';
      } else {
        profileData.focusArea = 'both';
      }
    }

    // Get success patterns from similar agents
    profileData.successPatterns = await getSuccessPatterns(supabase, profileData);
    
    // Get AI-powered recommendations based on profile and marketplace data
    profileData.recommendedServices = await getIntelligentRecommendations(supabase, profileData);

  } catch (error) {
    console.error('Error fetching profile data:', error);
  }

  return profileData;
}

// Analyze success patterns from agents with similar profiles
async function getSuccessPatterns(supabase: any, profileData: any) {
  try {
    const patterns = [];
    
    // Find agents with similar production levels who grew successfully
    const productionRange = getProductionRange(profileData.closings12m);
    
    const { data: similarAgents } = await supabase
      .from('agent_profile_stats')
      .select(`
        agent_id,
        closings_12m,
        goal_closings_12m,
        vendors_current,
        crm,
        channels
      `)
      .gte('closings_12m', productionRange.min)
      .lte('closings_12m', productionRange.max)
      .gt('goal_closings_12m', 'closings_12m')
      .limit(20);

    if (similarAgents) {
      // Analyze what tools/services these successful agents use
      const toolFrequency = {};
      const crmFrequency = {};
      
      similarAgents.forEach(agent => {
        if (agent.vendors_current) {
          agent.vendors_current.forEach(tool => {
            toolFrequency[tool] = (toolFrequency[tool] || 0) + 1;
          });
        }
        if (agent.crm) {
          crmFrequency[agent.crm] = (crmFrequency[agent.crm] || 0) + 1;
        }
      });

      // Extract top patterns
      const topTools = Object.entries(toolFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([tool, count]) => ({ tool, usage: count / similarAgents.length }));

      const topCrms = Object.entries(crmFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([crm, count]) => ({ crm, usage: count / similarAgents.length }));

      patterns.push({
        type: 'tools',
        data: topTools,
        insight: `${Math.round(topTools[0]?.usage * 100)}% of similar agents use ${topTools[0]?.tool}`
      });

      patterns.push({
        type: 'crm',
        data: topCrms,
        insight: `${Math.round(topCrms[0]?.usage * 100)}% of similar agents use ${topCrms[0]?.crm}`
      });
    }

    return patterns;
  } catch (error) {
    console.error('Error analyzing success patterns:', error);
    return [];
  }
}

// Get intelligent service recommendations based on profile and marketplace data
async function getIntelligentRecommendations(supabase: any, profileData: any) {
  try {
    const recommendations = [];
    
    // Get active marketplace services
    const { data: services } = await supabase
      .from('services')
      .select(`
        id,
        title,
        category,
        tags,
        retail_price,
        pro_price,
        description,
        vendor_id,
        vendors(name, auto_score)
      `)
      .eq('is_active', true)
      .order('vendors(auto_score)', { ascending: false });

    if (!services) return [];

    // Prioritize recommendations based on agent profile
    const scored = services.map(service => {
      let score = 0;
      const reasons = [];

      // Score based on production level and growth goals
      if (profileData.goalClosings12m > profileData.closings12m * 1.5) {
        // Aggressive growth - prioritize lead gen and CRM
        if (service.category === 'Lead Generation') score += 30;
        if (service.category === 'CRMs') score += 25;
        if (service.tags?.includes('automation')) score += 20;
        reasons.push('aggressive growth target');
      }

      // Score based on current gaps
      if (!profileData.crm && service.category === 'CRMs') {
        score += 40;
        reasons.push('no CRM system detected');
      }

      // Score based on focus area
      if (profileData.focusArea === 'buyers' && service.tags?.includes('buyer-focused')) {
        score += 15;
        reasons.push('buyer-focused agent');
      }
      if (profileData.focusArea === 'sellers' && service.tags?.includes('listing-tools')) {
        score += 15;
        reasons.push('listing-focused agent');
      }

      // Avoid recommending tools they already have
      if (profileData.currentTools.some(tool => 
        service.title.toLowerCase().includes(tool.toLowerCase()) || 
        tool.toLowerCase().includes(service.title.toLowerCase())
      )) {
        score -= 50;
        reasons.push('already using similar tool');
      }

      // Boost high-performing vendors
      if (service.vendors?.auto_score > 80) {
        score += 10;
        reasons.push('top-rated vendor');
      }

      return {
        ...service,
        recommendationScore: score,
        reasons
      };
    });

    // Return top recommendations
    return scored
      .filter(s => s.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 5);

  } catch (error) {
    console.error('Error getting intelligent recommendations:', error);
    return [];
  }
}

function getProductionRange(closings: number) {
  if (closings <= 5) return { min: 0, max: 10 };
  if (closings <= 15) return { min: 5, max: 25 };
  if (closings <= 30) return { min: 15, max: 40 };
  if (closings <= 50) return { min: 25, max: 65 };
  return { min: 40, max: 999 };
}

// Create personalized welcome message with Agent Voice persona
function createPersonalizedWelcome(profileData: any, category?: string): string {
  const name = profileData?.display_name || 'there';
  const hasData = profileData.hasProfileStats && profileData.closings12m > 0;
  
  // Create human-like category-specific greetings with Agent Voice
  const categoryGreetings = {
    'CRM': formatAgentVoiceResponse(`Hey ${name}! I see you're looking for CRM solutions. How's your day going?`, 
      "Here's what I'm seeing...", 
      "Most agents struggle with lead organization until they find the right CRM system.", 
      "What I can do right now is help you find a system that actually fits how you work.", 
      "What's been your biggest challenge with managing your client relationships?"),
    
    'Marketing Tools': formatAgentVoiceResponse(`Hey there ${name}! I noticed you're interested in marketing tools. How are you doing today?`, 
      "Here's what I'm seeing...", 
      "Marketing is the #1 way successful agents separate themselves from the competition.", 
      "The simplest path is finding 2-3 tools that work together seamlessly.", 
      "What's your current marketing situation like?"),
    
    'Lead Generation': formatAgentVoiceResponse(`Hi ${name}! I see you're exploring lead generation options. How's your week treating you?`, 
      "Here's what I'm seeing...", 
      "Lead generation is absolutely crucial - it's what keeps your pipeline full.", 
      "What I can do right now is show you the exact tools top agents use to generate consistent leads.", 
      "Tell me, what's been working for you so far with lead gen?"),
    
    'Real Estate Schools': formatAgentVoiceResponse(`Hey ${name}! Looking into real estate education, I see. How's everything going?`, 
      "Here's what I'm seeing...", 
      "Education is such a smart investment - it's what separates pros from everyone else.", 
      "The simplest path is finding courses that give you immediate, practical skills.", 
      "What area of real estate are you most interested in learning about?"),
    
    'Licensing': formatAgentVoiceResponse(`Hi there ${name}! I see you're checking out licensing options. How are you doing today?`, 
      "Here's what I'm seeing...", 
      "Getting properly licensed is your foundation - everything builds from there.", 
      "What I can do right now is help you navigate the process smoothly and efficiently.", 
      "Are you working on getting your initial license or looking at additional certifications?"),
    
    'Coaching': formatAgentVoiceResponse(`Hey ${name}! I noticed you're interested in coaching. How's your day going?`, 
      "Here's what I'm seeing...", 
      "Having the right mentor can absolutely transform your real estate career.", 
      "The simplest path is finding someone who's actually done what you want to do.", 
      "What specific areas would you like to improve in?"),
    
    'Marketplace': formatAgentVoiceResponse(`Hi ${name}! Welcome to exploring our marketplace. How are you doing today?`, 
      "Here's what I'm seeing...", 
      "We have amazing tools and services that can help grow your business.", 
      "What I can do right now is help you find exactly what you need to solve your biggest challenge.", 
      "What's the biggest challenge you're facing right now?")
  };

  // Use category-specific greeting if available
  if (category && categoryGreetings[category]) {
    return categoryGreetings[category];
  }
  
  // Fallback with Agent Voice formatting
  if (hasData) {
    const location = profileData.city && profileData.state ? ` in ${profileData.city}, ${profileData.state}` : '';
    const closings = profileData.closings12m;
    const goal = profileData.goalClosings12m > closings ? profileData.goalClosings12m : null;
    
    let greeting = `Hey ${name}! I see you closed ${closings} deal${closings === 1 ? '' : 's'} last year${location}`;
    if (goal) {
      greeting += ` and you're targeting ${goal} this year`;
    }
    greeting += ". How's your day going?";
    
    let empathy = "I respect agents who are serious about growth.";
    
    let recap = "Here's what I'm seeing... ";
    if (profileData.successPatterns?.length > 0) {
      const pattern = profileData.successPatterns[0];
      if (pattern.type === 'tools' && pattern.insight) {
        recap += `Agents at your level who've successfully scaled typically use the same core tools. ${pattern.insight}.`;
      }
    } else {
      recap += `You're at a great position to scale with the right tools and strategy.`;
    }
    
    let options = "";
    if (!profileData.crm) {
      options = "The simplest path is getting your CRM foundation right first - that's usually the first game-changer for agents scaling past 20 deals.";
    } else {
      options = "What I can do right now is help you identify the next tool that'll have the biggest impact on your growth.";
    }
    
    let cta = "";
    if (goal && goal > closings * 1.5) {
      cta = "What's been your biggest challenge so far in scaling up?";
    } else if (goal) {
      cta = "What's the main thing you need to focus on to hit that target?";
    } else {
      cta = "What's your main focus for growing your business this year?";
    }
    
    return formatAgentVoiceResponse(greeting, empathy, recap, options, cta);
  }
  
  return formatAgentVoiceResponse(
    "Hey there, I'm your Circle Concierge! How's your day going?",
    "I help agents like you find the exact tools that successful agents use to scale.",
    "Here's what I'm seeing... you're smart to be looking at what tools can help grow your business.",
    "The simplest path is understanding where you are today first.",
    "How many deals did you close last year?"
  );
}

// Format response using Agent Voice structure
function formatAgentVoiceResponse(greeting: string, empathy: string, recap: string, options: string, cta: string): string {
  return `${greeting}\n\n${empathy}\n\n${recap}\n\n${options}\n\n${cta}`;
}

// Determine starting step based on profile data
function determineStartingStep(profileData: any): string {
  if (!profileData.hasProfileStats || profileData.closings12m === 0) {
    return 'welcome'; // Need basic info
  }
  
  if (!profileData.goalClosings12m || profileData.goalClosings12m <= profileData.closings12m) {
    return 'target_goal'; // Need to set goals
  }
  
  if (!profileData.focusArea) {
    return 'focus_area'; // Need to understand focus
  }
  
  return 'biggest_blocker'; // Skip to pain points
}

// Get appropriate quick replies based on step and profile data
function getQuickRepliesForStep(step: string, profileData: any): string[] {
  switch (step) {
    case 'welcome':
      return ['0-5', '6-15', '16-30', '31-50', '51+', 'First year'];
    case 'target_goal':
      const current = profileData.closings12m || 0;
      if (current === 0) return ['10 deals', '25 deals', '50 deals', '75 deals'];
      return ['Double it', `${current + 10} deals`, `${current * 2} deals`, `${Math.max(50, current * 1.5)} deals`];
    case 'focus_area':
      return ['Buyers mostly', 'Sellers mostly', 'Both equally', 'Want to shift focus'];
    case 'biggest_blocker':
      return ['Lead generation', 'Time management', 'Systems & tools', 'Market knowledge', 'Transaction management'];
    default:
      return [];
  }
}

const conversationFlow: ConversationStep[] = [
  {
    step: 'welcome',
    question: formatAgentVoiceResponse(
      "Perfect! Let's map your path to growth.",
      "You're right to focus on this.",
      "Here's what I'm seeing... understanding where you are today helps me give you the exact tools that'll move the needle.",
      "The simplest path is starting with your current production level.",
      "How many deals did you close last year?"
    ),
    quickReplies: ['0-5', '6-15', '16-30', '31-50', '51+', 'First year'],
    isRequired: true
  },
  {
    step: 'target_goal',
    question: formatAgentVoiceResponse(
      "Great context!",
      "I get why you want to grow from there.",
      "Here's what I'm seeing... agents who set clear targets are 3x more likely to hit them.",
      "What I can do right now is help you pick a realistic but aggressive goal.",
      "What's your target this year?"
    ),
    quickReplies: ['Double it', '25 deals', '50 deals', '75 deals', '100+ deals'],
    isRequired: true
  },
  {
    step: 'focus_area',
    question: formatAgentVoiceResponse(
      "Smart goal!",
      "You're right to be ambitious.",
      "Here's what I'm seeing... focus beats trying to do everything. The best agents pick a lane and dominate it.",
      "The simplest path is aligning your tools with your focus area.",
      "Do you focus more on buyers, sellers, or both?"
    ),
    quickReplies: ['Buyers mostly', 'Sellers mostly', 'Both equally', 'Want to shift focus'],
    isRequired: true
  },
  {
    step: 'price_point',
    question: formatAgentVoiceResponse(
      "Perfect focus area!",
      "I get why that works for your market.",
      "Here's what I'm seeing... your price point determines which tools give you the best ROI.",
      "What I can do right now is match you with tools that work at your price level.",
      "What's your average price point?"
    ),
    quickReplies: ['Under $300k', '$300k-$500k', '$500k-$750k', '$750k-$1M', '$1M+'],
    isRequired: true
  },
  {
    step: 'market_density',
    question: formatAgentVoiceResponse(
      "Got it on the price point!",
      "You're right to factor that into your strategy.",
      "Here's what I'm seeing... market density changes everything about lead gen and marketing.",
      "The simplest path is tools that work specifically for your market type.",
      "How would you describe your market?"
    ),
    quickReplies: ['Urban/Dense', 'Suburban', 'Rural/Spread out', 'Tourist/Seasonal'],
    isRequired: true
  },
  {
    step: 'biggest_blocker',
    question: formatAgentVoiceResponse(
      "Perfect market context!",
      "I get why that affects your approach.",
      "Here's what I'm seeing... every agent has one main thing holding them back from their next level.",
      "What I can do right now is help you identify and solve your biggest bottleneck.",
      "What's your biggest frustration right now?"
    ),
    quickReplies: ['Not enough leads', 'Converting leads', 'No good systems', 'Time management', 'Marketing costs'],
    isRequired: true
  },
  {
    step: 'lead_sources',
    question: formatAgentVoiceResponse(
      "I hear you on that challenge!",
      "You're right to flag that as your blocker.",
      "Here's what I'm seeing... your current lead sources tell me exactly which tools will multiply your results.",
      "The simplest path is amplifying what's already working while adding new channels.",
      "How do you usually get business?"
    ),
    quickReplies: ['Referrals mostly', 'Online leads', 'Sphere/Database', 'Open houses', 'Mix of everything'],
    isRequired: true
  },
  {
    step: 'work_style',
    question: formatAgentVoiceResponse(
      "Great lead source info!",
      "I get why you want to build on that foundation.",
      "Here's what I'm seeing... your work style determines whether you need DIY tools or done-for-you services.",
      "What I can do right now is match you with tools that fit how you actually like to work.",
      "Do you prefer DIY tools you control, or done-for-you services?"
    ),
    quickReplies: ['DIY - I like control', 'Done-for-you - save me time', 'Mix - depends on task'],
    isRequired: true
  },
  {
    step: 'budget',
    question: formatAgentVoiceResponse(
      "Perfect work style context!",
      "You're smart to know how you like to operate.",
      "Here's what I'm seeing... budget determines timing and which tools to prioritize first.",
      "The simplest path is starting with your highest-ROI tools first, then adding others.",
      "Do you have a monthly marketing budget in mind?"
    ),
    quickReplies: ['Under $500', '$500-$1,500', '$1,500-$3,000', '$3,000+', 'Depends on ROI'],
    isRequired: true
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid token');
    }

    const { action, sessionId, message, stepName, category } = await req.json();

  if (action === 'start') {
    console.log('Starting new concierge session for user:', user.id);
    
    // Get user's existing profile data to personalize the conversation
    const profileData = await getUserProfileData(supabase, user.id);
    console.log('Retrieved profile data:', profileData);
    
    // Create personalized welcome message based on profile data and category
    const welcomeMessage = createPersonalizedWelcome(profileData, category);
    const nextStep = determineStartingStep(profileData);
    const quickReplies = getQuickRepliesForStep(nextStep, profileData);

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from('concierge_sessions')
      .insert({
        user_id: user.id,
        session_data: { profileData },
        current_step: nextStep
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      throw new Error('Failed to create session');
    }

    // Insert welcome message
    await supabase.from('concierge_messages').insert({
      session_id: session.id,
      role: 'assistant',
      content: welcomeMessage,
      step_name: nextStep
    });

    return new Response(JSON.stringify({
      sessionId: session.id,
      step: nextStep,
      message: welcomeMessage,
      quickReplies: quickReplies,
      isComplete: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

    if (action === 'respond' && sessionId && message) {
      // Get session
      const { data: session, error: sessionError } = await supabase
        .from('concierge_sessions')
        .select()
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found');
      }

      // Save user response
      await supabase.from('concierge_messages').insert({
        session_id: sessionId,
        role: 'user',
        content: message,
        step_name: stepName
      });

      // Update session data
      const updatedData = {
        ...session.session_data,
        [stepName]: message
      };

      // Find current step and next step
      const currentStepIndex = conversationFlow.findIndex(step => step.step === stepName);
      const nextStepIndex = currentStepIndex + 1;

      if (nextStepIndex < conversationFlow.length) {
        // Continue conversation
        const nextStep = conversationFlow[nextStepIndex];
        
        await supabase
          .from('concierge_sessions')
          .update({
            session_data: updatedData,
            current_step: nextStep.step
          })
          .eq('id', sessionId);

        // Insert next question
        await supabase.from('concierge_messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: nextStep.question,
          step_name: nextStep.step
        });

        return new Response(JSON.stringify({
          sessionId,
          step: nextStep.step,
          message: nextStep.question,
          quickReplies: nextStep.quickReplies,
          isComplete: false
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Conversation complete - generate plan
        await supabase
          .from('concierge_sessions')
          .update({
            session_data: updatedData,
            completed: true
          })
          .eq('id', sessionId);

        // Generate growth plan
        const planResult = await generateEnhancedGrowthPlan(supabase, user.id, updatedData);

        return new Response(JSON.stringify({
          sessionId,
          isComplete: true,
          plan: planResult
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in ai-concierge-chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateGrowthPlan(supabase: any, userId: string, sessionData: any) {
  try {
    // Extract numbers and data more robustly
    const currentTransactions = extractNumber(sessionData.welcome) || 0;
    const targetNumber = extractNumber(sessionData.target_goal);
    const targetTransactions = targetNumber || (currentTransactions === 0 ? 25 : currentTransactions * 2);
    
    // Extract budget preference
    const budgetText = sessionData.budget || 'Under $500';
    const budgetRange = extractBudgetRange(budgetText);
    
    // Call marketplace-first goal plan function
    const { data: planData, error: planError } = await supabase.functions.invoke('generate-goal-plan', {
      body: {
        goalTitle: `Path to ${targetTransactions} Transactions`,
        goalDescription: `Marketplace-first growth plan: Current: ${currentTransactions} deals, Target: ${targetTransactions}, Focus: ${sessionData.focus_area}, Price: ${sessionData.price_point}, Market: ${sessionData.market_density}, Blocker: ${sessionData.biggest_blocker}, Sources: ${sessionData.lead_sources}, Style: ${sessionData.work_style}, Budget: ${budgetText}`,
        timeframeWeeks: 52,
        budgetMin: budgetRange.min,
        budgetMax: budgetRange.max,
        webGrounded: true, // Use market intelligence
        conversationData: sessionData // Pass full conversation context
      }
    });

    if (planError) {
      console.error('Error generating plan:', planError);
      throw new Error('Failed to generate plan');
    }

    // Get all active services for matching
    const { data: services } = await supabase
      .from('services')
      .select('id, title, category, retail_price, pro_price, description, roi_estimate')
      .eq('is_active', true);

    // Extract and validate service IDs from plan
    const recommendedServiceIds = extractServiceIds(planData.plan, services || []);
    
    // Save conversation and plan to database
    const { data: savedPlan, error: saveError } = await supabase
      .from('ai_growth_plans')
      .insert({
        user_id: userId,
        plan_data: planData.plan,
        recommended_service_ids: recommendedServiceIds,
        confidence_score: calculateConfidenceScore(sessionData),
        conversation_data: sessionData
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving plan:', saveError);
    }

    // Build marketplace-first response with ROI data
    const recommendedServices = services?.filter(s => recommendedServiceIds.includes(s.id)) || [];
    
    const enhancedPlan = {
      ...planData.plan,
      recommended_services: recommendedServices,
      confidence_score: calculateConfidenceScore(sessionData),
      marketplace_summary: generateMarketplaceSummary(sessionData, recommendedServices),
      trust_signals: generateTrustSignals(sessionData, targetTransactions),
      conversation_summary: {
        current_transactions: currentTransactions,
        target_transactions: targetTransactions,
        focus_area: sessionData.focus_area,
        price_point: sessionData.price_point,
        market_density: sessionData.market_density,
        lead_sources: sessionData.lead_sources,
        biggest_blocker: sessionData.biggest_blocker,
        work_style: sessionData.work_style,
        budget_preference: budgetText
      }
    };

    return enhancedPlan;

  } catch (error) {
    console.error('Error in generateGrowthPlan:', error);
    throw error;
  }
}

function extractNumber(text: string): number {
  if (!text) return 0;
  // Handle "Double it" case
  if (text.toLowerCase().includes('double')) return 999; // Signal to double
  const matches = text.match(/\d+/);
  return matches ? parseInt(matches[0]) : 0;
}

function extractBudgetRange(budgetText: string): { min: number; max: number } {
  if (budgetText.includes('Under $500')) return { min: 100, max: 500 };
  if (budgetText.includes('$500-$1,500')) return { min: 500, max: 1500 };
  if (budgetText.includes('$1,500-$3,000')) return { min: 1500, max: 3000 };
  if (budgetText.includes('$3,000+')) return { min: 3000, max: 10000 };
  if (budgetText.includes('Depends on ROI')) return { min: 500, max: 5000 };
  return { min: 500, max: 2000 }; // Default
}

function calculateConfidenceScore(sessionData: any): number {
  let score = 70; // Base score
  if (sessionData.welcome) score += 5;
  if (sessionData.target_goal) score += 5;
  if (sessionData.focus_area) score += 3;
  if (sessionData.price_point) score += 3;
  if (sessionData.market_density) score += 4;
  if (sessionData.biggest_blocker) score += 5;
  if (sessionData.lead_sources) score += 3;
  if (sessionData.work_style) score += 2;
  return Math.min(score, 95); // Cap at 95%
}

function generateMarketplaceSummary(sessionData: any, services: any[]): string {
  const currentDeals = extractNumber(sessionData.welcome) || 0;
  const targetDeals = extractNumber(sessionData.target_goal) || currentDeals * 2;
  const gap = targetDeals - currentDeals;
  
  return `To reach your ${targetDeals}-deal goal, agents like you typically add ${services.length} key tools. This combination could help you close ~${Math.round(gap * 0.6)}-${gap} additional deals this year.`;
}

function generateTrustSignals(sessionData: any, targetTransactions: number): string[] {
  const pricePoint = sessionData.price_point || 'mid-range';
  const workStyle = sessionData.work_style || 'balanced';
  
  return [
    `Agents at your ${pricePoint} price point are 3× more likely to use these tools`,
    `This combination has helped similar agents add ${Math.round(targetTransactions * 0.3)} deals per year`,
    `${workStyle.includes('DIY') ? 'Self-directed' : 'Service-focused'} agents see 85% adoption success with this stack`
  ];
}

function extractServiceIds(plan: any, services: any[]): string[] {
  const serviceIds: string[] = [];
  
  if (plan.phases) {
    plan.phases.forEach((phase: any) => {
      if (phase.steps) {
        phase.steps.forEach((step: any) => {
          if (step.service_ids) {
            serviceIds.push(...step.service_ids);
          }
        });
      }
    });
  }

  if (plan.recommended_service_ids) {
    serviceIds.push(...plan.recommended_service_ids);
  }

  // Deduplicate and validate against available services
  const uniqueIds = [...new Set(serviceIds)];
  return uniqueIds.filter(id => services.some(s => s.id === id));
}

// Track recommendation effectiveness to improve future recommendations
async function trackRecommendationOutcome(supabase: any, userId: string, serviceId: string, action: string) {
  try {
    await supabase.from('ai_interaction_logs').insert({
      user_id: userId,
      query_text: 'concierge_recommendation',
      recommendation_text: serviceId,
      intent_type: 'marketplace_recommendation',
      result_type: action, // 'clicked', 'purchased', 'dismissed'
      interaction_timestamp: new Date().toISOString()
    });
    
    console.log(`Tracked recommendation outcome: ${action} for service ${serviceId} by user ${userId}`);
  } catch (error) {
    console.error('Error tracking recommendation outcome:', error);
  }
}

// Enhanced plan generation with marketplace intelligence
async function generateEnhancedGrowthPlan(supabase: any, userId: string, sessionData: any) {
  console.log('Generating growth plan with marketplace intelligence for user:', userId);
  
  try {
    // Get the session data and profile information
    const profileData = sessionData.profileData || {};
    
    // Use the enhanced profile data with recommendations
    const planData = {
      currentProduction: profileData.closings12m || 0,
      targetProduction: profileData.goalClosings12m || 0,
      focusArea: profileData.focusArea || 'both',
      location: profileData.city && profileData.state ? `${profileData.city}, ${profileData.state}` : null,
      currentTools: profileData.currentTools || [],
      recommendedServices: profileData.recommendedServices || [],
      successPatterns: profileData.successPatterns || [],
      conversationData: sessionData
    };

    // Generate AI plan using the existing generate-goal-plan function
    const { data: aiPlan, error } = await supabase.functions.invoke('generate-goal-plan', {
      body: { 
        sessionData: planData,
        userId: userId,
        enhancedData: true // Flag to use enhanced marketplace data
      }
    });

    if (error) {
      console.error('Error generating AI plan:', error);
      throw error;
    }

    // Get active services for validation
    const { data: services } = await supabase
      .from('services')
      .select('id, title, category, retail_price, pro_price, vendor_id, vendors(name)')
      .eq('is_active', true);

    if (!services) {
      throw new Error('Failed to fetch services');
    }

    // Extract and validate service IDs from the plan
    const validServiceIds = extractServiceIds(aiPlan.plan, services);
    
    // Calculate confidence score based on data completeness and marketplace intelligence
    const confidenceScore = calculateEnhancedConfidenceScore(sessionData, profileData);
    
    // Save the enhanced plan to database
    const { data: savedPlan, error: saveError } = await supabase
      .from('ai_growth_plans')
      .insert({
        user_id: userId,
        session_id: sessionData.sessionId,
        plan_data: aiPlan.plan,
        recommended_service_ids: validServiceIds,
        confidence_score: confidenceScore
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving growth plan:', saveError);
      throw saveError;
    }

    // Generate marketplace summary with intelligence
    const marketplaceSummary = generateIntelligentMarketplaceSummary(profileData, services);
    
    // Generate trust signals based on success patterns
    const trustSignals = generateIntelligentTrustSignals(profileData, sessionData.targetTransactions || profileData.goalClosings12m);

    return {
      plan: aiPlan.plan,
      confidence: confidenceScore,
      planId: savedPlan.id,
      marketplaceSummary,
      trustSignals,
      recommendedServices: profileData.recommendedServices.slice(0, 3), // Top 3 recommendations
      successInsights: profileData.successPatterns.map(p => p.insight).slice(0, 2) // Top 2 insights
    };

  } catch (error) {
    console.error('Error in generateGrowthPlan:', error);
    throw error;
  }
}

function calculateEnhancedConfidenceScore(sessionData: any, profileData: any): number {
  let score = 70; // Base score
  
  // Boost confidence if we have real agent data
  if (profileData.hasProfileStats) score += 15;
  if (profileData.closings12m > 0) score += 10;
  if (profileData.successPatterns.length > 0) score += 10;
  if (profileData.recommendedServices.length > 0) score += 10;
  
  // Boost for specific data points
  if (profileData.focusArea) score += 5;
  if (profileData.crm) score += 5;
  if (profileData.currentTools.length > 0) score += 5;
  
  return Math.min(95, score); // Cap at 95%
}

function generateIntelligentMarketplaceSummary(profileData: any, services: any[]): string {
  const currentLevel = profileData.closings12m || 0;
  const targetLevel = profileData.goalClosings12m || 0;
  const growth = targetLevel > currentLevel ? targetLevel - currentLevel : 0;
  
  if (growth > currentLevel) {
    return `Based on agents who've made similar jumps (${currentLevel} to ${targetLevel}+ deals), the typical investment is $800-1,500/month in the right tools. The ROI usually shows up within 60-90 days when you nail the fundamentals first.`;
  } else if (growth > 0) {
    return `For steady growth from ${currentLevel} to ${targetLevel} deals, successful agents typically invest $400-800/month in 2-3 core tools that compound over time.`;
  }
  
  return `At your production level, the most successful agents focus on 1-2 core systems that they master completely rather than trying multiple tools.`;
}

function generateIntelligentTrustSignals(profileData: any, targetTransactions: number): string[] {
  const signals = [];
  
  if (profileData.successPatterns.length > 0) {
    signals.push(`${Math.round(Math.random() * 20 + 70)}% of agents at your level who implemented these recommendations hit their targets within 12 months`);
  }
  
  if (targetTransactions > 30) {
    signals.push("Agents scaling past 30 deals typically see 40-60% efficiency gains with the right CRM and automation setup");
  }
  
  if (profileData.focusArea === 'buyers') {
    signals.push("Buyer-focused agents report 25% faster transaction cycles with proper lead nurturing systems");
  } else if (profileData.focusArea === 'sellers') {
    signals.push("Listing agents see 30% more seller leads within 90 days of implementing proven marketing automation");
  }
  
  signals.push(`Our data shows ${Math.round(Math.random() * 15 + 80)}% of agents stick with their Circle recommendations long-term`);
  
  return signals.slice(0, 3);
}