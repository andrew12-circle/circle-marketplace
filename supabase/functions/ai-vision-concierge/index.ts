import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    const { images, prompt, userId } = await req.json();

    console.log('AI Vision request received:', { 
      imageCount: images?.length || 0, 
      prompt: prompt?.substring(0, 100) + '...',
      userId 
    });

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!images || images.length === 0) {
      throw new Error('No images provided for analysis');
    }

    // Get user context for marketplace recommendations
    const userContext = await getUserContext(supabase, userId);
    
    // Get relevant marketplace services for image context
    const marketplaceContext = await getMarketplaceContext(supabase, prompt);

    // Prepare messages for vision analysis
    const messages = [
      {
        role: 'system',
        content: `You are a real estate AI concierge that analyzes images and provides brief, actionable advice.

RESPONSE RULES:
- Keep responses to 2-3 sentences max
- Be conversational and helpful like a human assistant
- Focus on practical, actionable advice
- If showing property photos, comment on staging, lighting, or marketing potential
- If showing marketing materials, suggest improvements
- Always end with a relevant question to continue the conversation

USER CONTEXT:
- Location: ${userContext.location || 'Not specified'}
- Experience: ${userContext.experience || 'Not specified'} years
- Focus: ${userContext.focus || 'General real estate'}

MARKETPLACE CONTEXT:
${marketplaceContext.map(service => `- ${service.title}: ${service.category} ($${service.price})`).join('\n')}

Analyze the image(s) and provide brief, helpful advice. Reference relevant marketplace services only if they directly solve a problem you identify in the image.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt || 'Please analyze this image and provide real estate advice.'
          },
          ...images.map((imageData: string) => ({
            type: 'image_url',
            image_url: {
              url: imageData,
              detail: 'low' // For faster processing and lower costs
            }
          }))
        ]
      }
    ];

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Vision-capable model
        messages,
        max_tokens: 300, // Keep responses brief
        temperature: 0.7,
      }),
    });

    const aiResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.error?.message || 'Unknown error'}`);
    }

    const analysis = aiResponse.choices[0].message.content;

    // Log the interaction
    await logVisionInteraction(supabase, userId, prompt, images.length, analysis);

    console.log('Vision analysis completed successfully');

    return new Response(JSON.stringify({ 
      analysis,
      suggestedServices: marketplaceContext.slice(0, 3) // Top 3 relevant services
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-vision-concierge:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      analysis: "I'm having trouble analyzing the image right now. Could you describe what you're looking for help with instead?"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getUserContext(supabase: any, userId: string) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, city, state, years_experience, specialties')
      .eq('user_id', userId)
      .single();

    return {
      location: profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : null,
      experience: profile?.years_experience,
      focus: profile?.specialties?.join(', ') || null
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    return {};
  }
}

async function getMarketplaceContext(supabase: any, prompt: string) {
  try {
    const keywords = prompt.toLowerCase();
    let categoryFilter = '';

    // Map common image/prompt keywords to marketplace categories
    if (keywords.includes('photo') || keywords.includes('picture') || keywords.includes('listing')) {
      categoryFilter = 'Photography';
    } else if (keywords.includes('marketing') || keywords.includes('flyer') || keywords.includes('brochure')) {
      categoryFilter = 'Marketing';
    } else if (keywords.includes('sign') || keywords.includes('yard')) {
      categoryFilter = 'Signage';
    } else if (keywords.includes('staging') || keywords.includes('home') || keywords.includes('property')) {
      categoryFilter = 'Staging';
    }

    let query = supabase
      .from('services')
      .select('id, title, category, retail_price, tags')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(5);

    if (categoryFilter) {
      query = query.ilike('category', `%${categoryFilter}%`);
    }

    const { data: services } = await query;

    return (services || []).map(service => ({
      id: service.id,
      title: service.title,
      category: service.category,
      price: service.retail_price?.replace(/[^0-9.]/g, '') || '0'
    }));
  } catch (error) {
    console.error('Error getting marketplace context:', error);
    return [];
  }
}

async function logVisionInteraction(supabase: any, userId: string, prompt: string, imageCount: number, analysis: string) {
  try {
    await supabase
      .from('ai_interaction_logs')
      .insert({
        user_id: userId,
        query: prompt,
        recommendation: analysis,
        intent_type: 'vision_analysis',
        result_type: 'image_advice',
        metadata: {
          image_count: imageCount,
          analysis_type: 'vision'
        }
      });
  } catch (error) {
    console.error('Error logging vision interaction:', error);
  }
}