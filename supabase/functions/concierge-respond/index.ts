import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface ConciergeResponse {
  type: string;
  message: string;
  trust?: any;
  handoff?: any;
  actions?: any[];
  quick_replies?: string[];
  citations?: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Concierge-respond function called');
    
    const { user_id, anon_id, thread_id, text } = await req.json();
    console.log('📝 Request data:', { user_id: user_id || 'null', anon_id, thread_id, text: text?.substring(0, 50) });

    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key is not configured');
      return new Response(JSON.stringify({ 
        type: 'answer',
        message: "I'm having trouble connecting to my AI service. Please contact support.",
        handoff: { suggest: true, reason: "Service configuration issue" }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!text?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🤖 Calling OpenAI...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are Andrew, Circle's AI concierge for real estate agents. You're knowledgeable, direct, and genuinely care about helping agents grow their business. 

PERSONALITY:
- Sound like a trusted business partner, not a robotic assistant
- Be conversational and use "you" language 
- Show genuine interest in their success
- Ask follow-up questions to understand their specific situation
- Use real estate terminology naturally but don't overdo it

KNOWLEDGE AREAS:
- CRMs and lead management systems
- Marketing automation and lead generation
- Real estate photography and virtual tours
- Social media marketing for agents
- Website and IDX solutions
- Transaction management tools
- Market analysis and data tools
- Agent coaching and training programs

CONVERSATION STYLE:
- Keep responses under 150 words for better flow
- End with a relevant follow-up question when appropriate
- Reference specific tools/services when relevant
- Share actionable insights, not just generic advice
- If they mention a specific challenge, dig deeper to understand their situation

Remember: You're here to help them find the RIGHT solution for THEIR specific business needs, not just recommend popular tools.` 
          },
          { role: 'user', content: text }
        ],
        max_tokens: 400,
        temperature: 0.8
      })
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const data = await openAIResponse.json();
    const responseContent = data.choices[0].message.content;

    console.log('✅ OpenAI response received');

    // Generate contextual quick replies based on the conversation
    const quickReplies = generateQuickReplies(text.toLowerCase(), responseContent);

    // Create response structure  
    const response: ConciergeResponse = {
      type: 'answer',
      message: responseContent,
      trust: {
        confidence: 88,
        peer_patterns: ["Natural conversation flow"],
        inventory_evidence: [],
        clarity_assessment: "Conversational response"
      },
      handoff: null,
      actions: [],
      quick_replies: quickReplies
    };

    // Save messages to database (allow null user_id for anonymous users)
    await saveMessages(user_id, thread_id, text, JSON.stringify(response));

    console.log('✅ Response generated successfully');
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in concierge-respond:', error);
    console.error('Error details:', error);
    
    // Return a helpful fallback response that feels human
    const fallbackResponse = {
      type: 'answer',
      message: "Hey there! I'm Andrew, your Circle AI concierge. I help real estate agents like you find the right tools and strategies to grow their business. What's the biggest challenge you're facing right now?",
      handoff: null,
      actions: [],
      quick_replies: [
        "I need more leads",
        "Help me organize my contacts", 
        "I want to automate my marketing",
        "Show me what other agents are using"
      ]
    };
    
    return new Response(JSON.stringify(fallbackResponse), {
      status: 200, // Return 200 instead of 500 for better UX
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function saveMessages(userId: string | null, threadId: string, userMessage: string, assistantResponse: string) {
  try {
    await supabase
      .from('concierge_chat_messages')
      .insert([
        {
          user_id: userId, // Allow null for anonymous users
          thread_id: threadId,
          role: 'user',
          content: userMessage
        },
        {
          user_id: userId, // Allow null for anonymous users
          thread_id: threadId,
          role: 'assistant',
          content: assistantResponse
        }
      ]);
  } catch (error) {
    console.error('Failed to save messages:', error);
  }
}

function generateQuickReplies(userInput: string, assistantResponse: string): string[] {
  // Default replies for general conversation
  const defaultReplies = [
    "Tell me about your current business challenges",
    "What's your biggest growth goal right now?",
    "Show me tools that could help"
  ];

  // Topic-specific quick replies
  if (userInput.includes('crm') || userInput.includes('customer') || userInput.includes('contact')) {
    return [
      "What's your budget for a CRM?",
      "How many leads do you get monthly?",
      "Do you need integration with other tools?"
    ];
  }

  if (userInput.includes('lead') || userInput.includes('marketing') || userInput.includes('ads')) {
    return [
      "What's your current lead source?",
      "What's your monthly marketing budget?",
      "Tell me about your target market"
    ];
  }

  if (userInput.includes('website') || userInput.includes('online') || userInput.includes('seo')) {
    return [
      "Do you have a website currently?",
      "What's your target area for SEO?",
      "Do you need IDX property search?"
    ];
  }

  if (userInput.includes('photography') || userInput.includes('photos') || userInput.includes('virtual')) {
    return [
      "How many listings do you have monthly?",
      "Do you need drone photography?",
      "What's your photography budget per listing?"
    ];
  }

  if (userInput.includes('coaching') || userInput.includes('training') || userInput.includes('learn')) {
    return [
      "What area do you want to improve most?",
      "How long have you been in real estate?",
      "What's your current transaction volume?"
    ];
  }

  if (userInput.includes('best') || userInput.includes('recommend') || userInput.includes('suggest')) {
    return [
      "Tell me more about your specific needs",
      "What's your budget range?",
      "What have you tried before?"
    ];
  }

  // If asking about goals or business
  if (userInput.includes('goal') || userInput.includes('grow') || userInput.includes('business')) {
    return [
      "What's your current transaction volume?",
      "What's holding you back right now?",
      "Where do you want to be in 12 months?"
    ];
  }

  // Check if assistant response mentions specific categories to generate relevant follow-ups
  const lowerResponse = assistantResponse.toLowerCase();
  if (lowerResponse.includes('crm') || lowerResponse.includes('contact management')) {
    return [
      "Compare CRM options for me",
      "What integrations should I look for?",
      "How much should I budget for a CRM?"
    ];
  }

  if (lowerResponse.includes('lead generation') || lowerResponse.includes('marketing')) {
    return [
      "Show me lead generation strategies",
      "What's the ROI on different marketing channels?",
      "Help me create a marketing plan"
    ];
  }

  return defaultReplies;
}