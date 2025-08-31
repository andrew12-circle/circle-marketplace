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

async function crawlWebsiteForPricing(websiteUrl: string): Promise<any> {
  if (!websiteUrl) return null;
  
  try {
    console.log(`Crawling website for pricing: ${websiteUrl}`);
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Circle Marketplace Bot/1.0)',
      },
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Extract pricing information using basic regex patterns
    const pricePatterns = [
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*dollars?/gi,
      /price[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /cost[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    ];
    
    const prices = [];
    for (const pattern of pricePatterns) {
      const matches = html.match(pattern);
      if (matches) {
        prices.push(...matches);
      }
    }
    
    // Look for duration patterns
    const durationPatterns = [
      /(?:per\s+)?(month|monthly|mo)/gi,
      /(?:per\s+)?(year|yearly|annual)/gi,
      /(?:per\s+)?(week|weekly)/gi,
      /(?:per\s+)?(day|daily)/gi,
    ];
    
    let duration = null;
    for (const pattern of durationPatterns) {
      const match = html.match(pattern);
      if (match) {
        duration = match[1].toLowerCase();
        break;
      }
    }
    
    return { 
      prices: prices.slice(0, 3), // Take first 3 prices found
      duration: duration === 'month' || duration === 'monthly' || duration === 'mo' ? 'monthly' :
                duration === 'year' || duration === 'yearly' || duration === 'annual' ? 'annual' :
                duration === 'week' || duration === 'weekly' ? 'weekly' :
                duration === 'day' || duration === 'daily' ? 'daily' : null
    };
  } catch (error) {
    console.error('Error crawling website:', error);
    return null;
  }
}

async function assessRESPACompliance(service: any): Promise<any> {
  const respaAssessmentPrompt = `Analyze this real estate service for RESPA Section 8 compliance:

Service: ${service.title}
Category: ${service.category || 'Not specified'}
Description: ${service.description || 'Not provided'}
Website: ${service.website_url || 'Not provided'}

RESPA Section 8 prohibits kickbacks for referrals, but allows legitimate co-marketing where lenders can pay their proportional share of actual marketing exposure.

Determine:
1. Can a lender legitimately cover part of this service cost?
2. If yes, what percentage split would be RESPA-compliant?

Consider these factors:
- Is this a legitimate marketing/advertising service?
- Would a lender get proportional marketing exposure?
- Does the service benefit the lender's business directly?
- Is the cost allocation based on actual exposure/benefit?

Return JSON only:
{
  "can_lender_cover": boolean,
  "allowed_split_percentage": number (0-50, or null if not applicable),
  "respa_reasoning": "Brief explanation of why this is/isn't RESPA compliant",
  "copay_allowed": boolean,
  "respa_split_limit": number (max percentage a lender can cover)
}`;

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
          { role: 'system', content: 'You are a RESPA compliance expert. Provide accurate legal assessments for real estate services.' },
          { role: 'user', content: respaAssessmentPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse RESPA assessment:', content);
      return null;
    }
  } catch (error) {
    console.error('Error in RESPA assessment:', error);
    return null;
  }
}

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
    let additionalData = {};

    switch (type) {
      case 'details':
        // Crawl website for pricing if not available
        let pricingData = null;
        if (service.website_url && (!service.retail_price || !service.duration)) {
          pricingData = await crawlWebsiteForPricing(service.website_url);
        }

        // Assess RESPA compliance
        const respaAssessment = await assessRESPACompliance(service);

        systemPrompt = `You are Andrew Heisley, founder of Circle Marketplace. Generate compelling service details that follow Circle's voice: clear, direct, confident, and ROI-focused. Always position services as curated, vetted solutions that save time and money.

Answer these 6 questions for agents:
1. Why should I care?
2. What's my ROI?
3. How soon will I see results?
4. How much does it cost?
5. What do I get with it?
6. Does it require a quote or can I buy now?

Focus on proven results, real testimonials, and measurable outcomes.

IMPORTANT: Return ONLY valid JSON, no markdown formatting or code blocks.`;

        userPrompt = `Generate optimized service details for: ${service.title}
Category: ${service.category || 'Not specified'}
Website: ${service.website_url || 'Not provided'}
${pricingData ? `Website Pricing Found: ${JSON.stringify(pricingData)}` : ''}
${service.existing_research ? `Research Data: ${JSON.stringify(service.existing_research)}` : ''}
${customPrompt ? `Additional Instructions: ${customPrompt}` : ''}

Return JSON with:
{
  "description": "Compelling 120-160 char card subheadline that sells the service",
  "estimated_roi": number (percentage like 1200 for 1200%),
  "duration": "Time to see results (e.g., '30 days')",
  "tags": ["10", "relevant", "category", "tags", "from", "our", "system"],
  "retail_price": "${pricingData?.prices?.[0] || service.retail_price || 'TBD'}",
  "price_duration": "${pricingData?.duration || service.price_duration || 'monthly'}"
}`;
        
        if (respaAssessment) {
          additionalData = { respaAssessment };
        }
        break;

      case 'disclaimer':
        systemPrompt = `Generate professional legal disclaimers for real estate service providers. Include RESPA compliance, co-marketing limitations, and standard legal protections.

IMPORTANT: Return ONLY valid JSON, no markdown formatting or code blocks.`;

        userPrompt = `Generate a comprehensive disclaimer for: ${service.title}
Category: ${service.category || 'Not specified'}
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
        systemPrompt = `You are Andrew Heisley creating high-converting sales funnels for Circle Marketplace. Write in your voice: clear, direct, confident. Focus on ROI, proven results, and agent success stories. Create compelling funnels that convert browsers into customers.

IMPORTANT: Return ONLY valid JSON, no markdown formatting or code blocks.`;

        userPrompt = `Create a complete sales funnel for: ${service.title}
Description: ${service.description || ''}
Category: ${service.category || 'Not specified'}
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

    console.log('Raw AI response:', content);

    let parsedContent;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      console.error('Parse error:', parseError);
      throw new Error('AI response was not valid JSON');
    }

    // Add additional data to response
    if (Object.keys(additionalData).length > 0) {
      parsedContent = { ...parsedContent, ...additionalData };
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