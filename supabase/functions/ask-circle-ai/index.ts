import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ASK-CIRCLE-AI] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY is not set");
    logStep("Gemini key verified");

    // Create Supabase client to fetch services data
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { message, prompt } = await req.json();
    const userPrompt = message || prompt;
    logStep("Received prompt", { prompt: userPrompt });

    // Check if this is a service comparison request
    const isComparison = userPrompt.includes('analyze and compare these services');
    
    let systemPrompt;
    
    if (isComparison) {
      systemPrompt = `You are Circle AI, an expert real estate marketing advisor. Analyze and compare the services provided by a real estate agent.

For service comparisons:
1. Analyze the pricing differences and value propositions
2. Compare features and benefits of each service
3. Recommend which service might be best for different scenarios
4. Provide insights on ROI and effectiveness
5. Keep the response clear and actionable

Provide a detailed comparison analysis in plain text format.`;
    } else {
      // Fetch available services from the database for general queries
      const { data: services, error: servicesError } = await supabaseClient
        .from('services')
        .select(`
          *,
          vendor:vendors (
            name,
            rating,
            review_count,
            is_verified
          )
        `);

      if (servicesError) {
        logStep("Error fetching services", { error: servicesError });
      }

      const servicesList = services || [];
      logStep("Fetched services", { count: servicesList.length });

      systemPrompt = `You are Circle AI, an expert real estate marketing advisor. You analyze agent locations, market conditions, and recommend the best marketing service bundles.

Available Services in our marketplace:
${servicesList.map(service => `- ${service.title}: ${service.description} (Category: ${service.category}, Price: ${service.price})`).join('\n')}

When analyzing a request:
1. Provide location-specific market analysis if location is mentioned
2. Identify agent buying patterns for that market
3. Recommend the best bundle of services that would provide highest ROI
4. Be specific about estimated ROI and time investment
5. Focus on services that complement each other

Respond in this exact JSON format:
{
  "locationAnalysis": "Brief analysis of the market area mentioned",
  "agentBuyingPatterns": "What successful agents in similar markets typically invest in",
  "topROIBundle": {
    "name": "Bundle name",
    "description": "Why this bundle is recommended for their area",
    "services": [
      {"name": "Service 1", "description": "Why this service helps"},
      {"name": "Service 2", "description": "Why this service helps"}
    ],
    "estimatedROI": "X.Xx in 90 days",
    "timeInvestment": "X-X hours/week"
  }
}`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nUser request: ${userPrompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Gemini API error", { status: response.status, error: errorText });
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    logStep("AI response received", { response: aiResponse });

    // For comparison requests, return the response directly
    if (isComparison) {
      return new Response(JSON.stringify({ response: aiResponse }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // For general queries, parse the JSON response
    let recommendation;
    try {
      recommendation = JSON.parse(aiResponse);
    } catch (parseError) {
      logStep("JSON parse error, creating fallback response");
      // Fallback response if JSON parsing fails
      recommendation = {
        locationAnalysis: "Based on the provided information, we've analyzed your market conditions and identified key opportunities for growth.",
        agentBuyingPatterns: "Successful agents in similar markets typically invest in a combination of digital marketing and local community engagement strategies.",
        topROIBundle: {
          name: "Digital Presence Package",
          description: "A comprehensive bundle designed to establish strong online presence and generate quality leads",
          services: [
            { name: "Social Media Management", description: "Builds brand awareness and engages local audience" },
            { name: "SEO Optimization", description: "Improves search visibility for local property searches" },
            { name: "Lead Generation System", description: "Captures and nurtures potential clients automatically" }
          ],
          estimatedROI: "2.5x in 90 days",
          timeInvestment: "3-5 hours/week"
        }
      };
    }

    logStep("Sending recommendation response");
    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in ask-circle-ai", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});