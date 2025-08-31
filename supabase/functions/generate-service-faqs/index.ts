import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { service, customPrompt } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are Andrew Heisley, founder of Circle Marketplace. Generate 7 essential FAQs that address real agent concerns about real estate services. Use your direct, confident voice.

Focus on:
1. Cost/ROI concerns
2. Time to results
3. Ease of use/setup
4. Support quality
5. Integration with existing tools
6. Results/guarantees
7. Contract/cancellation terms

Each FAQ should directly address skepticism and build confidence.

IMPORTANT: Return ONLY valid JSON, no markdown formatting or code blocks.`;

    const userPrompt = `Generate 7 baseline FAQs for: ${service.title}
Category: ${service.category || 'Not specified'}
Description: ${service.description || ''}
Website: ${service.website_url || 'Not provided'}
Price: ${service.retail_price || 'TBD'}
Duration: ${service.duration || 'Not specified'}
ROI: ${service.estimated_roi || 'TBD'}%
${service.existing_research ? `Research: ${JSON.stringify(service.existing_research)}` : ''}
${customPrompt ? `Additional Instructions: ${customPrompt}` : ''}

Return JSON with:
{
  "faqs": [
    {
      "id": "1",
      "question": "What's the real ROI I can expect?",
      "answer": "Specific, honest answer with numbers if possible",
      "category": "roi",
      "order": 1
    },
    {
      "id": "2", 
      "question": "How quickly will I see results?",
      "answer": "Realistic timeline with expectations",
      "category": "timeline",
      "order": 2
    },
    {
      "id": "3",
      "question": "Is this easy to set up and use?",
      "answer": "Clear explanation of setup process",
      "category": "usability", 
      "order": 3
    },
    {
      "id": "4",
      "question": "What kind of support do I get?",
      "answer": "Support options and quality",
      "category": "support",
      "order": 4
    },
    {
      "id": "5",
      "question": "Does this integrate with my existing tools?",
      "answer": "Integration capabilities",
      "category": "integration",
      "order": 5
    },
    {
      "id": "6",
      "question": "Do you guarantee results?",
      "answer": "Honest guarantees/expectations",
      "category": "guarantees",
      "order": 6
    },
    {
      "id": "7",
      "question": "What are the contract terms?",
      "answer": "Clear contract/cancellation terms",
      "category": "contract",
      "order": 7
    }
  ]
}`;

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('Raw FAQ AI response:', content);

    let parsedContent;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse FAQ AI response:', content);
      console.error('Parse error:', parseError);
      throw new Error('FAQ AI response was not valid JSON');
    }

    console.log(`✅ Generated FAQs for service: ${service.title}`);

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-service-faqs:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate FAQs' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});