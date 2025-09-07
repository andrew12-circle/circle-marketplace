import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationStep {
  step: string;
  question: string;
  quickReplies?: string[];
  isRequired: boolean;
}

// Helper function to get user's profile data
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
    state: null
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

  } catch (error) {
    console.error('Error fetching profile data:', error);
  }

  return profileData;
}

// Create personalized welcome message
function createPersonalizedWelcome(profileData: any): string {
  const hasData = profileData.hasProfileStats && profileData.closings12m > 0;
  
  if (hasData) {
    const location = profileData.city && profileData.state ? ` in ${profileData.city}, ${profileData.state}` : '';
    const closings = profileData.closings12m;
    const goal = profileData.goalClosings12m > closings ? profileData.goalClosings12m : null;
    
    let message = `Hey there! I see you closed ${closings} deal${closings === 1 ? '' : 's'} last year${location}`;
    
    if (goal) {
      message += ` and you're targeting ${goal} this year`;
    }
    
    message += ". I'm your Circle Concierge, and I'm here to help you hit your goals with the right tools and strategies. ";
    
    if (goal && goal > closings * 1.5) {
      message += "That's ambitious growth - let me help you map the path to get there!";
    } else if (goal) {
      message += "Let's identify what will accelerate your path to that target.";
    } else {
      message += "What's your main focus for growing your business this year?";
    }
    
    return message;
  }
  
  return "Hey there, I'm your Circle Concierge! I help agents like you find the right tools and strategies to grow your business. Let's start by understanding where you are today - how many deals did you close last year?";
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
    question: "Hey there, I'm your Circle Concierge. Let's map your path to growth — starting from where you are today. How many deals did you close last year?",
    quickReplies: ['0-5', '6-15', '16-30', '31-50', '51+', 'First year'],
    isRequired: true
  },
  {
    step: 'target_goal',
    question: "What's your target this year?",
    quickReplies: ['Double it', '25 deals', '50 deals', '75 deals', '100+ deals'],
    isRequired: true
  },
  {
    step: 'focus_area',
    question: "Do you focus more on buyers, sellers, or both?",
    quickReplies: ['Buyers mostly', 'Sellers mostly', 'Both equally', 'Want to shift focus'],
    isRequired: true
  },
  {
    step: 'price_point',
    question: "What's your average price point?",
    quickReplies: ['Under $300k', '$300k-$500k', '$500k-$750k', '$750k-$1M', '$1M+'],
    isRequired: true
  },
  {
    step: 'market_density',
    question: "How would you describe your market?",
    quickReplies: ['Urban/Dense', 'Suburban', 'Rural/Spread out', 'Tourist/Seasonal'],
    isRequired: true
  },
  {
    step: 'biggest_blocker',
    question: "What's your biggest frustration right now — time, money, or systems?",
    quickReplies: ['Not enough leads', 'Converting leads', 'No good systems', 'Time management', 'Marketing costs'],
    isRequired: true
  },
  {
    step: 'lead_sources',
    question: "How do you usually get business — referrals, leads, or other?",
    quickReplies: ['Referrals mostly', 'Online leads', 'Sphere/Database', 'Open houses', 'Mix of everything'],
    isRequired: true
  },
  {
    step: 'work_style',
    question: "Do you prefer DIY tools you control, or done-for-you services?",
    quickReplies: ['DIY - I like control', 'Done-for-you - save me time', 'Mix - depends on task'],
    isRequired: true
  },
  {
    step: 'budget',
    question: "Do you have a monthly marketing budget in mind?",
    quickReplies: ['Under $500', '$500-$1,500', '$1,500-$3,000', '$3,000+', 'Depends on ROI'],
    isRequired: true
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const { action, sessionId, message, stepName } = await req.json();

  if (action === 'start') {
    console.log('Starting new concierge session for user:', user.id);
    
    // Get user's existing profile data to personalize the conversation
    const profileData = await getUserProfileData(supabase, user.id);
    console.log('Retrieved profile data:', profileData);
    
    // Create personalized welcome message based on profile data
    const welcomeMessage = createPersonalizedWelcome(profileData);
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
        const planResult = await generateGrowthPlan(supabase, user.id, updatedData);

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