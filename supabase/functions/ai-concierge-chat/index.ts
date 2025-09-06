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

const conversationFlow: ConversationStep[] = [
  {
    step: 'welcome',
    question: "Hey there — I'm your Circle Concierge! Let's map out your path from where you are to where you want to be. How many transactions did you close last year?",
    quickReplies: ['0-5', '6-15', '16-30', '31-50', '51+'],
    isRequired: true
  },
  {
    step: 'target_goal',
    question: "Great! What's your target for this year?",
    quickReplies: ['Double it', '10-20', '25-50', '75-100', '100+'],
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
    step: 'lead_sources',
    question: "How do you usually get business today?",
    quickReplies: ['Referrals mostly', 'Online leads', 'Open houses', 'Sphere/Database', 'Mix of everything'],
    isRequired: true
  },
  {
    step: 'biggest_blocker',
    question: "What's your biggest frustration right now?",
    quickReplies: ['Not enough time', 'Not enough leads', 'No good systems', 'Converting leads', 'Staying organized'],
    isRequired: true
  },
  {
    step: 'work_style',
    question: "Do you prefer DIY solutions or done-for-you services?",
    quickReplies: ['DIY - I like control', 'Done-for-you - save me time', 'Mix - depends on the task'],
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
      // Create new session
      const { data: session, error: sessionError } = await supabase
        .from('concierge_sessions')
        .insert({
          user_id: user.id,
          session_data: {},
          current_step: 'welcome'
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
        content: conversationFlow[0].question,
        step_name: 'welcome'
      });

      return new Response(JSON.stringify({
        sessionId: session.id,
        step: 'welcome',
        message: conversationFlow[0].question,
        quickReplies: conversationFlow[0].quickReplies,
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
    // Convert conversation responses to plan parameters
    const currentTransactions = extractNumber(sessionData.welcome) || 0;
    const targetTransactions = extractNumber(sessionData.target_goal) || currentTransactions * 2;
    
    // Call generate-goal-plan function
    const { data: planData, error: planError } = await supabase.functions.invoke('generate-goal-plan', {
      body: {
        goalTitle: `Scale from ${currentTransactions} to ${targetTransactions} transactions`,
        goalDescription: `Based on your conversation: Focus area: ${sessionData.focus_area}, Price point: ${sessionData.price_point}, Lead sources: ${sessionData.lead_sources}, Biggest blocker: ${sessionData.biggest_blocker}, Work style: ${sessionData.work_style}`,
        timeframeWeeks: 52, // 1 year
        budgetMin: 500,
        budgetMax: 5000,
        webGrounded: false
      }
    });

    if (planError) {
      console.error('Error generating plan:', planError);
      throw new Error('Failed to generate plan');
    }

    // Get services to match recommendations
    const { data: services } = await supabase
      .from('services')
      .select('id, title, category, retail_price, pro_price')
      .eq('is_active', true);

    // Extract service recommendations from plan
    const recommendedServiceIds = extractServiceIds(planData.plan, services || []);
    
    // Save plan to database
    const { data: savedPlan, error: saveError } = await supabase
      .from('ai_growth_plans')
      .insert({
        user_id: userId,
        plan_data: planData.plan,
        recommended_service_ids: recommendedServiceIds,
        confidence_score: 75 // Based on conversation completeness
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving plan:', saveError);
    }

    // Enhance plan with marketplace recommendations
    const enhancedPlan = {
      ...planData.plan,
      recommended_services: services?.filter(s => recommendedServiceIds.includes(s.id)) || [],
      confidence_score: 75,
      conversation_summary: {
        current_transactions: currentTransactions,
        target_transactions: targetTransactions,
        focus_area: sessionData.focus_area,
        price_point: sessionData.price_point,
        lead_sources: sessionData.lead_sources,
        biggest_blocker: sessionData.biggest_blocker,
        work_style: sessionData.work_style
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
  const matches = text.match(/\d+/);
  return matches ? parseInt(matches[0]) : 0;
}

function extractServiceIds(plan: any, services: any[]): string[] {
  // Simple extraction logic - look for service IDs in phases
  const serviceIds: string[] = [];
  
  if (plan.phases) {
    plan.phases.forEach((phase: any) => {
      if (phase.service_ids) {
        serviceIds.push(...phase.service_ids);
      }
    });
  }

  if (plan.recommended_service_ids) {
    serviceIds.push(...plan.recommended_service_ids);
  }

  // Deduplicate and validate
  const uniqueIds = [...new Set(serviceIds)];
  return uniqueIds.filter(id => services.some(s => s.id === id));
}