
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
    const { type, service, customPrompt } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'details':
        systemPrompt = `You are Andrew Heisley, founder of Circle Marketplace. Generate compelling service details that follow Circle's voice: clear, direct, confident, and ROI-focused. Always position services as curated, vetted solutions that save time and money.

Answer these 6 questions for agents:
1. Why should I care?
2. What's my ROI?
3. How soon will I see results?
4. How much does it cost?
5. What do I get with it?
6. Does it require a quote or can I buy now?

Focus on proven results, real testimonials, and measurable outcomes.`;

        userPrompt = `Generate optimized service details for: ${service.title}
Category: ${service.category}
Website: ${service.website_url || 'Not provided'}
${service.existing_research ? `Research Data: ${JSON.stringify(service.existing_research)}` : ''}
${customPrompt ? `Additional Instructions: ${customPrompt}` : ''}

Return JSON with:
{
  "description": "Compelling 90-140 char card description",
  "estimated_roi": number (percentage like 1200 for 1200%),
  "duration": "Time to see results (e.g., '30 days')",
  "tags": ["relevant", "category", "tags"]
}`;
        break;

      case 'disclaimer':
        systemPrompt = `Generate professional legal disclaimers for real estate service providers. Include RESPA compliance, co-marketing limitations, and standard legal protections.`;

        userPrompt = `Generate a comprehensive disclaimer for: ${service.title}
Category: ${service.category}
Website: ${service.website_url || 'Not provided'}
${customPrompt ? `Additional Instructions: ${customPrompt}` : ''}

Return JSON with:
{
  "disclaimer_content": {
    "respa_compliance": "RESPA compliance statement",
    "comarketing_limits": "Co-marketing limitations",
    "liability_limitations": "Liability and warranty disclaimers",
    "data_privacy": "Data privacy and usage terms",
    "general_terms": "General terms and conditions"
  }
}`;
        break;

      case 'funnel':
        systemPrompt = `You are Andrew Heisley creating high-converting sales funnels for Circle Marketplace. Write in your voice: clear, direct, confident. Focus on ROI, proven results, and agent success stories. Create compelling funnels that convert browsers into customers.`;

        userPrompt = `Create a complete sales funnel for: ${service.title}
Description: ${service.description || ''}
Category: ${service.category}
Website: ${service.website_url || 'Not provided'}
Retail Price: ${service.retail_price || 'Not provided'}
Pro Price: ${service.pro_price || 'Not provided'}
ROI: ${service.estimated_roi || 'TBD'}%
Duration: ${service.duration || 'Not specified'}
${service.existing_research ? `Research: ${JSON.stringify(service.existing_research)}` : ''}
${customPrompt ? `Instructions: ${customPrompt}` : ''}

Create comprehensive funnel content with compelling headlines, benefits, testimonials, and pricing tiers.

Return JSON with:
{
  "funnel_content": {
    "headline": "Compelling main headline",
    "subheadline": "Supporting subheadline",
    "heroDescription": "Detailed hero description",
    "estimatedRoi": number,
    "duration": "string",
    "whyChooseUs": {
      "title": "Why Choose This Service",
      "benefits": [
        {
          "icon": "trending-up",
          "title": "Benefit title",
          "description": "Benefit description"
        }
      ]
    },
    "media": [],
    "packages": [],
    "testimonialCards": {
      "enabled": true,
      "title": "Success Stories",
      "cards": [
        {
          "id": "1",
          "name": "Agent Name",
          "role": "Company",
          "content": "Testimonial content",
          "rating": 5,
          "timeAgo": "2 weeks ago",
          "borderColor": "green",
          "iconColor": "green",
          "icon": "trending"
        }
      ]
    },
    "callToAction": {
      "primaryHeadline": "Ready to Transform Your Business?",
      "primaryDescription": "Join successful agents already using this service",
      "primaryButtonText": "Get Started Today",
      "secondaryHeadline": "Questions? Let's Talk",
      "secondaryDescription": "Speak with our team about your specific needs",
      "contactInfo": {
        "phone": "",
        "email": "",
        "website": ""
      }
    }
  },
  "pricing_tiers": [
    {
      "id": "1",
      "name": "Professional",
      "description": "Perfect for growing agents",
      "price": "199",
      "originalPrice": "249",
      "duration": "mo",
      "features": [
        {"id": "1", "text": "Feature 1", "included": true},
        {"id": "2", "text": "Feature 2", "included": true}
      ],
      "isPopular": true,
      "buttonText": "Get Started",
      "badge": "Most Popular",
      "position": 0
    }
  ]
}`;
        break;

      default:
        throw new Error(`Unknown generation type: ${type}`);
    }

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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('AI response was not valid JSON');
    }

    console.log(`✅ Generated ${type} for service: ${service.title}`);

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-service-generator:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate content' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
