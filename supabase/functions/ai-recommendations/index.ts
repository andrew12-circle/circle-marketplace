import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, preferences, recentActivity, limit = 5 } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile and activity data
    const { data: profile } = await supabase
      .from('profiles')
      .select('specialties, location, years_experience')
      .eq('user_id', userId)
      .single();

    // Get user's saved services for preference learning
    const { data: savedServices } = await supabase
      .from('saved_services')
      .select(`
        services (
          title,
          description,
          category,
          price_retail,
          vendor_id
        )
      `)
      .eq('user_id', userId);

    // Get user's consultation history
    const { data: consultations } = await supabase
      .from('consultation_bookings')
      .select(`
        services (
          title,
          category,
          vendor_id
        )
      `)
      .eq('user_id', userId);

    // Get available services
    const { data: allServices } = await supabase
      .from('services')
      .select(`
        id,
        title,
        description,
        category,
        price_retail,
        vendor_id,
        vendors (
          business_name,
          location
        )
      `)
      .limit(50);

    // Prepare context for AI recommendations
    const userContext = {
      specialties: profile?.specialties || [],
      location: profile?.location || '',
      experience: profile?.years_experience || 0,
      savedServices: savedServices?.map(s => s.services) || [],
      consultationHistory: consultations?.map(c => c.services) || [],
      preferences: preferences || {},
      recentActivity: recentActivity || []
    };

    const servicesContext = allServices?.map(service => ({
      id: service.id,
      title: service.title,
      description: service.description,
      category: service.category,
      price: service.price_retail,
      vendor: service.vendors?.business_name,
      location: service.vendors?.location
    })) || [];

    // Generate AI recommendations using OpenAI
    const prompt = `
You are an intelligent recommendation engine for a professional services marketplace. 
Analyze the user profile and recommend the most relevant services.

User Profile:
- Specialties: ${userContext.specialties.join(', ')}
- Location: ${userContext.location}
- Experience: ${userContext.experience} years
- Previously saved services: ${userContext.savedServices.map(s => s?.title).join(', ')}
- Previous consultations: ${userContext.consultationHistory.map(c => c?.title).join(', ')}

Available Services:
${servicesContext.slice(0, 20).map(s => `- ${s.title} (${s.category}) - $${s.price} by ${s.vendor}`).join('\n')}

Based on the user's profile, specialties, and past behavior, recommend ${limit} services that would be most valuable to them.
Consider:
1. Relevance to their specialties
2. Career advancement opportunities
3. Complementary skills
4. Geographic proximity
5. Price appropriateness

Respond with ONLY a JSON array of service IDs in order of recommendation strength:
["service-id-1", "service-id-2", ...]
`;

    if (!openAIApiKey) {
      // Fallback to simple rule-based recommendations
      const recommendations = servicesContext
        .filter(service => {
          // Simple matching based on specialties and category
          const matchesSpecialty = userContext.specialties.some(specialty => 
            service.category.toLowerCase().includes(specialty.toLowerCase()) ||
            service.title.toLowerCase().includes(specialty.toLowerCase())
          );
          
          const matchesLocation = !userContext.location || 
            service.location?.toLowerCase().includes(userContext.location.toLowerCase());
          
          return matchesSpecialty || matchesLocation;
        })
        .slice(0, limit)
        .map(s => s.id);

      return new Response(
        JSON.stringify({ 
          recommendations,
          source: 'rule-based',
          message: 'OpenAI API key not configured, using rule-based recommendations'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
          { 
            role: 'system', 
            content: 'You are an expert recommendation engine. Always respond with valid JSON arrays only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      }),
    });

    const aiData = await response.json();
    let recommendedIds: string[] = [];

    try {
      const aiResponse = aiData.choices[0].message.content.trim();
      recommendedIds = JSON.parse(aiResponse);
      
      // Validate that recommended IDs exist in our services
      recommendedIds = recommendedIds.filter(id => 
        servicesContext.some(s => s.id === id)
      );
      
      // If AI didn't return valid IDs, fall back to rule-based
      if (recommendedIds.length === 0) {
        throw new Error('No valid recommendations from AI');
      }
      
    } catch (error) {
      console.error('Error parsing AI response:', error);
      
      // Fallback to rule-based recommendations
      recommendedIds = servicesContext
        .filter(service => {
          const matchesSpecialty = userContext.specialties.some(specialty => 
            service.category.toLowerCase().includes(specialty.toLowerCase())
          );
          return matchesSpecialty;
        })
        .slice(0, limit)
        .map(s => s.id);
    }

    // Get full service details for recommendations
    const { data: recommendedServices } = await supabase
      .from('services')
      .select(`
        id,
        title,
        description,
        category,
        price_retail,
        vendor_id,
        vendors (
          business_name,
          location,
          rating
        )
      `)
      .in('id', recommendedIds);

    // Sort by original recommendation order
    const sortedRecommendations = recommendedIds
      .map(id => recommendedServices?.find(s => s.id === id))
      .filter(Boolean);

    // Track recommendation event
    await supabase
      .from('vendor_agent_activities')
      .insert({
        vendor_id: null,
        agent_id: userId,
        activity_type: 'ai_recommendation_generated',
        activity_data: {
          recommended_services: recommendedIds,
          recommendation_source: 'ai',
          user_context: {
            specialties: userContext.specialties,
            location: userContext.location
          }
        }
      });

    return new Response(
      JSON.stringify({ 
        recommendations: sortedRecommendations,
        source: 'ai-powered',
        count: sortedRecommendations.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-recommendations function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});