import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConciergeResponse {
  type: 'answer' | 'ask' | 'actions';
  message: string;
  quick_replies?: string[];
  actions?: Array<{
    label: string;
    action: 'view_services' | 'start_workflow' | 'open_link' | 'book_meeting';
    params: Record<string, any>;
  }>;
  trust?: {
    confidence: number;
    peer_patterns: string[];
  };
  citations?: Array<{
    title: string;
    source: 'marketplace' | 'kb';
    id: string;
  }>;
  handoff?: {
    suggest: boolean;
    reason?: string;
  };
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Concierge-respond function called');
    
    const { user_id, thread_id, text } = await req.json();
    console.log('📝 Request data:', { user_id: user_id || 'null', thread_id, text: text?.substring(0, 50) });

    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key is not configured');
      return new Response(JSON.stringify({ 
        type: 'answer',
        message: "I'm having trouble connecting to my AI service. Please contact support.",
        handoff: { suggest: true, reason: "Service configuration issue" }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    if (!thread_id || !text) {
      console.error('❌ Missing required fields:', { thread_id, text });
      return new Response(JSON.stringify({ 
        type: 'answer',
        message: "Missing required fields",
        handoff: { suggest: true, reason: "Invalid request" }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user profile (handle cases where user_id might be undefined)
    console.log('👤 Fetching user profile...');
    const profile = await fetchProfile(user_id || null);
    
    // Get recent messages for context
    const { data: messages } = await supabase
      .from('concierge_chat_messages')
      .select('*')
      .eq('thread_id', thread_id)
      .order('created_at', { ascending: false })
      .limit(12);

    // RAG search for relevant knowledge
    const ragSnippets = await kbSearch(text, 6);
    
    // Get market pulse insights
    const marketPulse = await getMarketPulse(profile);

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(profile, marketPulse, ragSnippets);
    
    // Prepare conversation history
    const conversationHistory = [
      { role: 'system', content: systemPrompt },
      ...(messages?.reverse().map(m => ({ role: m.role, content: m.content })) || []),
      { role: 'user', content: text }
    ];

    // Call OpenAI with tools
    const tools = [
      {
        type: 'function',
        function: {
          name: 'vendor_search',
          description: 'Search for vendors and services in the Circle marketplace',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              category: { type: 'string' },
              budget_min: { type: 'number' },
              budget_max: { type: 'number' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'recommend_bundle',
          description: 'Recommend service bundles based on goals and profile',
          parameters: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              profile: { type: 'object' }
            },
            required: ['goal']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'kb_search',
          description: 'Search knowledge base for specific information',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              k: { type: 'number', default: 6 }
            },
            required: ['query']
          }
        }
      }
    ];

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: conversationHistory,
        tools,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
    });

    const data = await openAIResponse.json();
    let responseContent = data.choices[0].message.content;

    // Handle tool calls if present
    if (data.choices[0].message.tool_calls) {
      for (const toolCall of data.choices[0].message.tool_calls) {
        const toolResult = await executeToolCall(toolCall, profile);
        // Add tool result to conversation and re-query if needed
        conversationHistory.push({
          role: 'tool',
          content: JSON.stringify(toolResult),
          tool_call_id: toolCall.id
        });
      }

      // Re-query OpenAI with tool results
      const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: conversationHistory,
          temperature: 0.3,
          response_format: { type: 'json_object' }
        }),
      });

      const finalData = await finalResponse.json();
      responseContent = finalData.choices[0].message.content;
    }

    // Parse response and add trust metrics
    console.log('✨ Parsing OpenAI response...');
    const response: ConciergeResponse = JSON.parse(responseContent);
    response.trust = calculateTrust(response, ragSnippets, profile);
    
    // Determine handoff
    if (response.trust.confidence < 45) {
      console.log('⚠️ Low confidence, suggesting handoff');
      response.handoff = {
        suggest: true,
        reason: "This request needs clarification or specialized expertise. Let's connect you with a human agent concierge."
      };
      response.actions = response.actions || [];
      response.actions.push({
        label: "Book with an Agent Concierge",
        action: "book_meeting",
        params: { source: "concierge", topic: text.substring(0, 100) }
      });
    }

    // Save messages to database
    console.log('💾 Saving messages to database...');
    await saveMessages(user_id, thread_id, text, responseContent);

    console.log('✅ Concierge response completed successfully');
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in concierge-respond:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        type: 'answer',
        message: "I'm having trouble processing your request right now. Let me connect you with a human agent concierge.",
        handoff: { suggest: true, reason: "Technical issue" },
        actions: [{
          label: "Book with an Agent Concierge",
          action: "book_meeting",
          params: { source: "concierge", topic: "technical_issue" }
        }]
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function fetchProfile(userId: string | null) {
  if (!userId) {
    return {
      territory: "Unknown",
      niche: "General",
      experience_level: "new_agent"
    };
  }
  
  const { data } = await supabase
    .from('profiles')
    .select(`
      *,
      agent_profile_stats(*),
      agent_questionnaires(*)
    `)
    .eq('user_id', userId)
    .single();
  
  return data || {
    territory: "Unknown", 
    niche: "General",
    experience_level: "new_agent"
  };
}

async function kbSearch(query: string, k: number = 6) {
  // Simplified for now - would use vector similarity search in production
  const { data } = await supabase
    .from('kb_chunks')
    .select(`
      *,
      kb_documents(title, source)
    `)
    .textSearch('content', query)
    .limit(k);
  
  return data || [];
}

async function getMarketPulse(profile: any) {
  const { data } = await supabase
    .from('concierge_market_pulse')
    .select('insights')
    .order('generated_at', { ascending: false })
    .limit(3);
  
  return data?.flatMap(d => d.insights) || [];
}

function buildSystemPrompt(profile: any, marketPulse: any[], ragSnippets: any[]) {
  return `You are Circle's Agent Concierge, a straight shooting agent-to-agent advisor.
Talk like a top producer mentoring a peer.
Be concise, practical and specific.
Use agent terms naturally: SOI, CMA, IDX, ISA, GCI, DOM, price band, nurture, drip.
Ask one quick clarifying question when needed, then recommend.
Never claim compliance. Never assign a cash value to Circle Points. Do not say "free for agents". Use "Circle Pro".
Prefer vendors and bundles available in the Circle Marketplace. If unsure, call tools to check.
Combine the agent profile, agents like you, peer patterns, and live marketplace inventory.
Recommend two or three options with who it's best for, time and cost ranges, and next steps.
Reference specific SKUs by title and link.
Always include quick replies and actions that map to our UI.
If confidence is low or the ask is ambiguous, suggest talking to a human and include a handoff object.

PROFILE: ${JSON.stringify(profile)}
MARKET_PULSE: ${marketPulse.map(insight => `• ${insight}`).join('\n')}
RAG_SNIPPETS: ${ragSnippets.map(s => `${s.kb_documents?.title}: ${s.content.substring(0, 200)}...`).join('\n')}

Always respond with valid JSON matching the ConciergeResponse interface.`;
}

async function executeToolCall(toolCall: any, profile: any) {
  const { name, arguments: args } = toolCall.function;
  const parsedArgs = JSON.parse(args);

  switch (name) {
    case 'vendor_search':
      return await vendorSearch(parsedArgs);
    case 'recommend_bundle':
      return await recommendBundle(parsedArgs, profile);
    case 'kb_search':
      return await kbSearch(parsedArgs.query, parsedArgs.k || 6);
    default:
      return { error: 'Unknown tool' };
  }
}

async function vendorSearch(args: any) {
  let query = supabase
    .from('services')
    .select(`
      id,
      title,
      category,
      price_min,
      price_max,
      url,
      vendors(name)
    `)
    .eq('is_active', true);

  if (args.category) {
    query = query.ilike('category', `%${args.category}%`);
  }
  if (args.query) {
    query = query.or(`title.ilike.%${args.query}%,description.ilike.%${args.query}%`);
  }
  if (args.budget_min) {
    query = query.gte('price_min', args.budget_min);
  }
  if (args.budget_max) {
    query = query.lte('price_max', args.budget_max);
  }

  const { data } = await query.limit(10);
  return data || [];
}

async function recommendBundle(args: any, profile: any) {
  // Simplified bundle recommendation logic
  const bundles = await vendorSearch({ query: args.goal });
  return {
    items: bundles.slice(0, 3).map(b => ({
      sku_id: b.id,
      title: b.title,
      why_it_fits: `Good fit for ${args.goal} based on your profile`
    })),
    rationale: `Based on your goals and profile, these services align with ${args.goal}`,
    estimated_cost_range: "$200-$800/month"
  };
}

function calculateTrust(response: ConciergeResponse, ragSnippets: any[], profile: any) {
  // Simplified trust calculation
  const peerWeight = 40;
  const inventoryWeight = 25;
  const clarityWeight = 20;
  const kbWeight = 15;

  const peerScore = Math.min(40, ragSnippets.length * 10);
  const inventoryScore = response.actions?.length ? 25 : 10;
  const clarityScore = response.message.length > 50 ? 20 : 10;
  const kbScore = ragSnippets.length > 3 ? 15 : 5;

  const confidence = Math.round(peerScore + inventoryScore + clarityScore + kbScore);

  return {
    confidence,
    peer_patterns: [
      "Agents in your price band typically use 2-3 core tools",
      "Most successful agents in your region invest in lead generation first"
    ]
  };
}

async function saveMessages(userId: string, threadId: string, userMessage: string, assistantResponse: string) {
  await supabase
    .from('concierge_chat_messages')
    .insert([
      {
        user_id: userId,
        thread_id: threadId,
        role: 'user',
        content: userMessage
      },
      {
        user_id: userId,
        thread_id: threadId,
        role: 'assistant',
        content: assistantResponse
      }
    ]);
}