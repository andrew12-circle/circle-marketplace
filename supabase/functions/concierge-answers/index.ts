import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, context } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing concierge query:', query);

    // Step 1: Search internal AI knowledge base
    const internalKnowledge = await searchInternalKnowledge(supabase, query);
    console.log('Found internal knowledge items:', internalKnowledge.length);

    // Step 2: If we have good internal knowledge, use it primarily
    if (internalKnowledge.length > 0) {
      const response = await generateResponseWithInternalKnowledge(query, internalKnowledge, context);
      
      // Log the interaction
      await logInteraction(supabase, query, response, 'internal_knowledge');
      
      return new Response(
        JSON.stringify({ 
          response,
          source: 'internal_knowledge',
          knowledge_items_used: internalKnowledge.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Fallback to existing AI recommendations system
    console.log('No internal knowledge found, falling back to AI recommendations');
    
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ 
          response: "I don't have specific information about that in my knowledge base. Please contact our support team for detailed assistance.",
          source: 'fallback'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await getAIRecommendation(query, context);
    
    // Log the interaction
    await logInteraction(supabase, query, aiResponse, 'ai_generated');
    
    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        source: 'ai_generated'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in concierge-answers function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process query',
        response: "I'm having trouble processing your request right now. Please try again or contact support.",
        source: 'error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function searchInternalKnowledge(supabase: any, query: string) {
  try {
    // Extract key terms from the query for better matching
    const searchTerms = extractSearchTerms(query);
    console.log('Search terms:', searchTerms);

    // Search by title, content, and tags
    const { data: knowledge, error } = await supabase
      .from('service_ai_knowledge')
      .select(`
        *,
        services!inner(
          id,
          name,
          category,
          is_active
        )
      `)
      .eq('is_active', true)
      .eq('services.is_active', true)
      .or(
        searchTerms.map(term => 
          `title.ilike.%${term}%,content.ilike.%${term}%,tags.cs.{"${term}"}`
        ).join(',')
      )
      .order('priority', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }

    return knowledge || [];
  } catch (error) {
    console.error('Error in searchInternalKnowledge:', error);
    return [];
  }
}

function extractSearchTerms(query: string): string[] {
  // Remove common words and extract meaningful terms
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'what', 'how', 'when', 'where', 'why', 'is', 'are', 'can', 'could', 'should', 'would'];
  
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !commonWords.includes(term))
    .slice(0, 10); // Limit to 10 terms
}

async function generateResponseWithInternalKnowledge(query: string, knowledge: any[], context?: any) {
  try {
    if (!openAIApiKey) {
      // Fallback without AI - format the knowledge nicely
      const knowledgeText = knowledge.map(item => 
        `**${item.services.name} - ${item.title}**\n${item.content}`
      ).join('\n\n');
      
      return `Based on our internal knowledge base, here's what I found:\n\n${knowledgeText}`;
    }

    // Use AI to synthesize the knowledge into a coherent response
    const knowledgeContext = knowledge.map(item => ({
      service: item.services.name,
      title: item.title,
      content: item.content,
      type: item.knowledge_type,
      tags: item.tags
    }));

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
            content: `You are a helpful real estate service concierge. Use the provided internal knowledge to answer user questions accurately and helpfully. 
            
            Always prioritize the internal knowledge over general information. Be specific about services and provide actionable advice.
            
            Internal Knowledge Available:
            ${JSON.stringify(knowledgeContext, null, 2)}`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response with internal knowledge:', error);
    // Fallback to simple knowledge formatting
    const knowledgeText = knowledge.map(item => 
      `**${item.services.name} - ${item.title}**\n${item.content}`
    ).join('\n\n');
    
    return `Based on our internal knowledge base:\n\n${knowledgeText}`;
  }
}

async function getAIRecommendation(query: string, context?: any) {
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
          {
            role: 'system',
            content: `You are a helpful real estate service concierge. Provide practical, actionable advice about real estate services, marketing, and business operations. 
            
            Keep responses conversational but informative. If you don't have specific information, be honest about it and suggest next steps.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI recommendation:', error);
    return "I'm having trouble accessing my AI capabilities right now. Please contact our support team for assistance with your question.";
  }
}

async function logInteraction(supabase: any, query: string, response: string, source: string) {
  try {
    await supabase
      .from('ai_interaction_logs')
      .insert({
        query_text: query,
        recommendation_text: response,
        intent_type: 'concierge_query',
        result_type: source,
        interaction_timestamp: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Error logging interaction:', error);
    // Don't throw - logging failure shouldn't break the response
  }
}