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
            content: `You are Circle AI, a helpful concierge for real estate agents. You help agents find the right tools, services, and strategies to grow their business. Be conversational, helpful, and knowledgeable about real estate technology and business growth. Keep responses friendly and under 200 words.` 
          },
          { role: 'user', content: text }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const data = await openAIResponse.json();
    const responseContent = data.choices[0].message.content;

    console.log('✅ OpenAI response received');

    // Create response structure  
    const response: ConciergeResponse = {
      type: 'answer',
      message: responseContent,
      trust: {
        confidence: 85,
        peer_patterns: ["AI conversation response"],
        inventory_evidence: [],
        clarity_assessment: "Direct response"
      },
      handoff: null,
      actions: [],
      quick_replies: [
        "Tell me about your business goals",
        "What services do you need help with?", 
        "Show me top tools for agents"
      ]
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
    
    // Return a helpful fallback response
    const fallbackResponse = {
      type: 'answer',
      message: "I'm here to help! I can assist you with finding the right tools and services for your real estate business. What would you like to know about?",
      handoff: null,
      actions: [],
      quick_replies: [
        "What CRM should I use?",
        "Help me generate more leads",
        "Show me marketing tools"
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