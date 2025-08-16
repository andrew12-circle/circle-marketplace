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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { query, userId, userContext, issueType = 'general' } = await req.json();

    console.log('Autonomous help AI request:', { query, userId, issueType });

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'AI service unavailable',
        fallbackResponse: await generateFallbackResponse(supabase, query, issueType)
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Analyze the query and classify the issue
    const issueAnalysis = await analyzeUserIssue(query, userContext, issueType);
    
    // Step 2: Search knowledge base for relevant solutions
    const knowledgeBase = await searchKnowledgeBase(supabase, query, issueAnalysis.category);
    
    // Step 3: Get user's recent help interactions and issues
    const userHelpHistory = userId ? await getUserHelpHistory(supabase, userId) : null;
    
    // Step 4: Check for proactive help triggers
    if (userId) {
      await checkProactiveHelpTriggers(supabase, userId, userContext, issueAnalysis);
    }
    
    // Step 5: Generate comprehensive AI response
    const aiResponse = await generateAutonomousResponse({
      query,
      issueAnalysis,
      knowledgeBase,
      userHelpHistory,
      userContext
    });

    // Step 6: Create or update help issue tracking
    let helpIssue = null;
    if (userId && issueAnalysis.severity !== 'low') {
      helpIssue = await createHelpIssue(supabase, {
        userId,
        issueType: issueAnalysis.category,
        severity: issueAnalysis.severity,
        title: issueAnalysis.title,
        description: query,
        contextData: { userContext, issueAnalysis },
        aiConfidenceScore: aiResponse.confidenceScore,
        autoResolved: aiResponse.confidenceScore > 0.8
      });
    }

    // Step 7: Learn from interaction
    await logAILearning(supabase, {
      userQuery: query,
      aiResponse: aiResponse.response,
      contextData: { userContext, issueAnalysis },
      resolutionAchieved: aiResponse.confidenceScore > 0.7
    });

    // Step 8: Provide self-service actions if applicable
    const selfServiceActions = await generateSelfServiceActions(issueAnalysis, knowledgeBase);

    return new Response(JSON.stringify({
      response: aiResponse.response,
      confidenceScore: aiResponse.confidenceScore,
      issueAnalysis,
      selfServiceActions,
      helpIssueId: helpIssue?.id,
      suggestedFollowUps: aiResponse.followUps,
      escalationRecommended: aiResponse.confidenceScore < 0.5,
      knowledgeBaseMatches: knowledgeBase.slice(0, 3)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in autonomous help AI:', error);
    return new Response(JSON.stringify({ 
      error: 'AI processing failed',
      fallbackResponse: "I apologize, but I'm experiencing technical difficulties. Please try rephrasing your question or contact our support team."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeUserIssue(query: string, userContext: any, issueType: string) {
  const keywords = query.toLowerCase();
  
  // Advanced issue classification
  let category = issueType;
  let severity = 'medium';
  let title = query.substring(0, 100);
  
  // Technical issues
  if (keywords.includes('error') || keywords.includes('bug') || keywords.includes('broken') || keywords.includes('not working')) {
    category = 'technical';
    severity = keywords.includes('can\'t') || keywords.includes('unable') ? 'high' : 'medium';
  }
  
  // Billing/payment issues
  else if (keywords.includes('payment') || keywords.includes('billing') || keywords.includes('charge') || keywords.includes('subscription')) {
    category = 'billing';
    severity = keywords.includes('charged') || keywords.includes('refund') ? 'high' : 'medium';
  }
  
  // Account issues
  else if (keywords.includes('login') || keywords.includes('password') || keywords.includes('account') || keywords.includes('access')) {
    category = 'account';
    severity = keywords.includes('locked') || keywords.includes('can\'t login') ? 'high' : 'medium';
  }
  
  // Feature questions
  else if (keywords.includes('how to') || keywords.includes('how do') || keywords.includes('where is') || keywords.includes('find')) {
    category = 'feature';
    severity = 'low';
  }

  // Critical indicators
  if (keywords.includes('urgent') || keywords.includes('critical') || keywords.includes('immediately')) {
    severity = 'critical';
  }

  return {
    category,
    severity,
    title,
    urgency: severity === 'critical' ? 'immediate' : severity === 'high' ? 'high' : 'normal',
    sentiment: keywords.includes('frustrated') || keywords.includes('annoyed') ? 'negative' : 'neutral',
    complexityScore: query.length > 200 ? 0.8 : query.length > 100 ? 0.6 : 0.4
  };
}

async function searchKnowledgeBase(supabase: any, query: string, category: string) {
  try {
    const { data, error } = await supabase
      .from('help_knowledge_base')
      .select('*')
      .or(`category.eq.${category},title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('usage_count', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Knowledge base search failed:', error);
    return [];
  }
}

async function getUserHelpHistory(supabase: any, userId: string) {
  try {
    const { data, error } = await supabase
      .from('help_issues')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching help history:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Help history fetch failed:', error);
    return null;
  }
}

async function checkProactiveHelpTriggers(supabase: any, userId: string, userContext: any, issueAnalysis: any) {
  try {
    // Check for repetitive issues
    const { data: recentIssues } = await supabase
      .from('help_issues')
      .select('issue_type')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (recentIssues && recentIssues.length > 3) {
      await supabase
        .from('help_proactive_triggers')
        .insert({
          user_id: userId,
          trigger_type: 'stuck_pattern',
          trigger_data: {
            issue_type: issueAnalysis.category,
            frequency: recentIssues.length,
            context: userContext
          }
        });
    }

    // Check for error patterns
    if (issueAnalysis.category === 'technical' && issueAnalysis.severity === 'high') {
      await supabase
        .from('help_proactive_triggers')
        .insert({
          user_id: userId,
          trigger_type: 'error_pattern',
          trigger_data: {
            error_type: issueAnalysis.title,
            context: userContext,
            timestamp: new Date().toISOString()
          }
        });
    }
  } catch (error) {
    console.error('Error checking proactive triggers:', error);
  }
}

async function generateAutonomousResponse(params: any) {
  const { query, issueAnalysis, knowledgeBase, userHelpHistory, userContext } = params;

  // Build context for AI
  const systemPrompt = `You are an advanced autonomous help AI assistant. You provide comprehensive, accurate, and empathetic support.

Your capabilities:
- Analyze user issues deeply and provide precise solutions
- Access knowledge base for verified information  
- Learn from previous interactions
- Provide step-by-step guidance
- Offer proactive recommendations
- Handle complex troubleshooting

Current issue analysis:
- Category: ${issueAnalysis.category}
- Severity: ${issueAnalysis.severity}
- Sentiment: ${issueAnalysis.sentiment}

Available knowledge base entries:
${knowledgeBase.map(kb => `- ${kb.title}: ${kb.content.substring(0, 200)}...`).join('\n')}

User context: ${JSON.stringify(userContext)}

Guidelines:
- Be comprehensive but concise
- Provide actionable solutions
- Include prevention tips
- Suggest follow-up actions
- Be empathetic and professional
- If confidence is low, recommend human escalation`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.3,
        max_tokens: 800
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Calculate confidence based on knowledge base matches and issue complexity
    let confidenceScore = 0.7; // Base confidence
    
    if (knowledgeBase.length > 0) confidenceScore += 0.2;
    if (issueAnalysis.category !== 'general') confidenceScore += 0.1;
    if (issueAnalysis.complexityScore < 0.5) confidenceScore += 0.1;
    if (userHelpHistory && userHelpHistory.length === 0) confidenceScore += 0.1;

    // Generate follow-up questions
    const followUps = generateFollowUpQuestions(issueAnalysis, aiResponse);

    return {
      response: aiResponse,
      confidenceScore: Math.min(confidenceScore, 0.95),
      followUps
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Generate fallback response based on knowledge base
    const fallbackResponse = knowledgeBase.length > 0 
      ? `Based on our knowledge base, here's what I found about your ${issueAnalysis.category} question:\n\n${knowledgeBase[0].content}\n\nWould you like me to provide more specific guidance?`
      : `I understand you're having an issue with ${issueAnalysis.category}. While I process your request, here are some general troubleshooting steps that often help. Could you provide more specific details about what you're experiencing?`;

    return {
      response: fallbackResponse,
      confidenceScore: 0.4,
      followUps: [`Can you provide more details about your ${issueAnalysis.category} issue?`]
    };
  }
}

function generateFollowUpQuestions(issueAnalysis: any, aiResponse: string): string[] {
  const followUps = [];
  
  switch (issueAnalysis.category) {
    case 'technical':
      followUps.push(
        "Did this solution resolve your issue?",
        "Are you experiencing any other technical problems?",
        "Would you like me to guide you through additional troubleshooting steps?"
      );
      break;
    case 'billing':
      followUps.push(
        "Do you need help with any other billing questions?",
        "Would you like information about payment methods?",
        "Is there anything else about your subscription I can help with?"
      );
      break;
    case 'account':
      followUps.push(
        "Are you now able to access your account?",
        "Do you need help setting up any account features?",
        "Would you like tips on securing your account?"
      );
      break;
    default:
      followUps.push(
        "Was this information helpful?",
        "Do you have any other questions?",
        "Is there anything else I can assist you with?"
      );
  }
  
  return followUps.slice(0, 2); // Return top 2 follow-ups
}

async function createHelpIssue(supabase: any, issueData: any) {
  try {
    const { data, error } = await supabase
      .from('help_issues')
      .insert({
        user_id: issueData.userId,
        issue_type: issueData.issueType,
        severity: issueData.severity,
        title: issueData.title,
        description: issueData.description,
        ai_confidence_score: issueData.aiConfidenceScore,
        auto_resolved: issueData.autoResolved,
        context_data: issueData.contextData,
        status: issueData.autoResolved ? 'resolved' : 'analyzing'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating help issue:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Help issue creation failed:', error);
    return null;
  }
}

async function logAILearning(supabase: any, learningData: any) {
  try {
    await supabase
      .from('help_ai_learning')
      .insert({
        user_query: learningData.userQuery,
        ai_response: learningData.aiResponse,
        context_data: learningData.contextData,
        resolution_achieved: learningData.resolutionAchieved
      });
  } catch (error) {
    console.error('Error logging AI learning:', error);
  }
}

async function generateSelfServiceActions(issueAnalysis: any, knowledgeBase: any[]) {
  const actions = [];
  
  switch (issueAnalysis.category) {
    case 'technical':
      actions.push(
        { type: 'guide', title: 'Clear browser cache and cookies', url: '/help/clear-cache' },
        { type: 'guide', title: 'Check system requirements', url: '/help/requirements' },
        { type: 'action', title: 'Run diagnostics', action: 'run_diagnostics' }
      );
      break;
    case 'billing':
      actions.push(
        { type: 'page', title: 'View billing history', url: '/billing/history' },
        { type: 'page', title: 'Update payment method', url: '/billing/payment' },
        { type: 'guide', title: 'Understanding charges', url: '/help/billing-faq' }
      );
      break;
    case 'account':
      actions.push(
        { type: 'page', title: 'Reset password', url: '/auth/reset-password' },
        { type: 'page', title: 'Account settings', url: '/settings' },
        { type: 'guide', title: 'Account security tips', url: '/help/security' }
      );
      break;
    case 'feature':
      actions.push(
        { type: 'tour', title: 'Take a guided tour', action: 'start_tour' },
        { type: 'guide', title: 'Video tutorials', url: '/academy/videos' },
        { type: 'page', title: 'Feature documentation', url: '/help/features' }
      );
      break;
  }

  // Add knowledge base articles as actions
  knowledgeBase.slice(0, 2).forEach(kb => {
    actions.push({
      type: 'article',
      title: kb.title,
      content: kb.content,
      id: kb.id
    });
  });

  return actions.slice(0, 4); // Return top 4 actions
}

async function generateFallbackResponse(supabase: any, query: string, issueType: string) {
  const fallbackResponses = {
    technical: "I understand you're experiencing a technical issue. Here are some common solutions that might help: 1) Try refreshing the page, 2) Clear your browser cache, 3) Check your internet connection. If the problem persists, please provide more details about what you're experiencing.",
    billing: "For billing questions, you can view your billing history and manage payment methods in your account settings. If you need immediate assistance with charges or subscriptions, please provide more details about your specific concern.",
    account: "For account-related issues, try logging out and back in, or use the password reset option if you're having trouble accessing your account. If you need further assistance, please describe the specific problem you're encountering.",
    feature: "I'd be happy to help you learn about our features. You can explore our Academy section for tutorials and guides, or try our interactive tours. What specific feature would you like to learn about?",
    general: "I'm here to help with any questions you have about our platform. Please provide more details about what you're looking for, and I'll do my best to assist you or direct you to the right resources."
  };

  return fallbackResponses[issueType] || fallbackResponses.general;
}