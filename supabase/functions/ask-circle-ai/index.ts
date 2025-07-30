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

// Input validation helper
const validateInput = (input: any) => {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { type, prompt, currentPerformance, futureGoals } = input;
  
  if (!type || typeof type !== 'string') {
    throw new Error('Type is required and must be a string');
  }
  
  if (type === 'quick') {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required for quick assessment and must be a string');
    }
    
    if (prompt.length > 2000) {
      throw new Error('Prompt too long. Maximum 2000 characters allowed');
    }
    
    // Sanitize input - remove potentially harmful content
    const sanitizedPrompt = prompt
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
      
    if (!sanitizedPrompt) {
      throw new Error('Prompt cannot be empty after sanitization');
    }
    
    return { type, prompt: sanitizedPrompt };
  }
  
  if (type === 'detailed') {
    if (!currentPerformance || !futureGoals) {
      throw new Error('Current performance and future goals are required for detailed assessment');
    }
    
    return { type, currentPerformance, futureGoals };
  }
  
  throw new Error('Type must be either "quick" or "detailed"');
};

// Rate limiting store
const rateLimitStore = new Map();

const checkRateLimit = (key: string) => {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10;
  
  const requests = rateLimitStore.get(key) || [];
  const validRequests = requests.filter((timestamp: number) => now - timestamp < windowMs);
  
  if (validRequests.length >= maxRequests) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    // Rate limiting
    const rateLimitKey = req.headers.get('x-forwarded-for') || 'unknown';
    checkRateLimit(rateLimitKey);

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY is not set");
    logStep("Gemini key verified");

    // Validate and sanitize input
    const requestBody = await req.json();
    const validatedInput = validateInput(requestBody);
    logStep("Input validated", { type: validatedInput.type });

    // Create Supabase client to fetch services data
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    let systemPrompt = '';
    let userPrompt = '';

    if (validatedInput.type === 'quick') {
      // Handle quick assessment
      logStep('Processing quick assessment...');
      
      // Check if it's a service comparison request
      const isComparison = validatedInput.prompt.toLowerCase().includes('compare') || 
                          validatedInput.prompt.toLowerCase().includes('vs') ||
                          validatedInput.prompt.toLowerCase().includes('versus');

      if (isComparison) {
        systemPrompt = `You are Circle AI, a specialized real estate marketing advisor. 
        
        Your role is to provide clear, actionable comparisons between real estate marketing services and strategies.
        
        When comparing services:
        1. Focus on ROI potential, cost-effectiveness, and market impact
        2. Consider the target agent's likely experience level and market
        3. Provide specific recommendations with reasoning
        4. Include implementation timeframes and difficulty levels
        5. Always end with your top recommendation and why
        
        Keep responses professional, data-driven, and under 500 words.`;

        userPrompt = validatedInput.prompt;
      } else {
        // Fetch services for general queries
        logStep('Fetching services data...');
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

        systemPrompt = `You are Circle AI, an expert real estate marketing advisor with access to a comprehensive database of marketing services and vendor partnerships.

        Your role is to analyze agent locations, market conditions, and provide data-driven marketing recommendations.

        Available services in your database:
        ${servicesList.map(service => `- ${service.title}: ${service.description} (Category: ${service.category}, Price: ${service.price})`).join('\n')}

        Guidelines for recommendations:
        1. Always structure your response as a JSON object with these exact fields:
           - locationAnalysis: detailed analysis of the location's market dynamics
           - agentBuyingPatterns: insights about what agents typically purchase in this market
           - topROIBundle: object with name, description, services array, estimatedROI, and timeInvestment

        2. For locationAnalysis: Focus on market trends, competition levels, price points, and opportunities
        3. For agentBuyingPatterns: Discuss typical marketing spend, preferred channels, and seasonal patterns
        4. For topROIBundle: Select 3-4 complementary services that work well together, provide realistic ROI estimates

        5. Keep all text conversational and actionable
        6. ROI estimates should be realistic (e.g., "3:1 - 5:1" or "200-300%")
        7. Time investments should be practical (e.g., "2-3 hours setup, 30 min/week maintenance")

        Return ONLY the JSON object, no additional text.`;

        userPrompt = validatedInput.prompt;
      }
    } else {
      // Handle detailed assessment
      logStep('Processing detailed assessment...');
      
      const { currentPerformance, futureGoals } = validatedInput;
      
      // Fetch services for detailed analysis
      logStep('Fetching services data...');
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

      systemPrompt = `You are Circle AI, an expert real estate marketing strategist specializing in personalized growth plans.

      You have access to comprehensive agent performance data and a database of marketing services.

      Available services in your database:
      ${servicesList.map(service => `- ${service.title}: ${service.description} (Category: ${service.category}, Price: ${service.price})`).join('\n')}

      Agent's Current Performance:
      - Location: ${currentPerformance.location || 'Not provided'}
      - Deal Volume (12m): ${currentPerformance.dealVolume12m || 'Not provided'}
      - Buyer/Seller Split: ${currentPerformance.buyerDeals || 'Not provided'}% buyers, ${currentPerformance.sellerDeals || 'Not provided'}% sellers
      - Average Prices: Buyers ${currentPerformance.avgBuyerPrice || 'Not provided'}, Sellers ${currentPerformance.avgSellerPrice || 'Not provided'}
      - Preferred Lenders: ${currentPerformance.preferredLenders || 'Not provided'}
      - Cash vs Financing: ${currentPerformance.cashRatio || 'Not provided'}

      Agent's Future Goals:
      - Target Volume: ${futureGoals.targetVolume || 'Not provided'}
      - Timeframe: ${futureGoals.timeframe || 'Not specified'}
      - Target Price Points: ${futureGoals.targetPricePoint || 'Not provided'}
      - Market Expansion: ${futureGoals.marketExpansion || 'Not provided'}
      - Partnership Goals: ${futureGoals.partnershipGoals || 'Not provided'}
      - Specific Challenges: ${futureGoals.specificChallenges || 'Not provided'}

      Your task is to create a comprehensive marketing strategy that bridges where they are to where they want to go.

      Structure your response as a JSON object with these exact fields:
      - locationAnalysis: detailed market analysis including growth opportunities and competitive landscape
      - agentBuyingPatterns: analysis of current performance vs goals, identifying gaps and opportunities
      - topROIBundle: strategic service bundle recommendation with name, description, services array, estimatedROI, and timeInvestment

      Focus on:
      1. Gap analysis between current and target performance
      2. Market-specific opportunities in their location
      3. Services that address their specific challenges
      4. Realistic timeline and ROI projections
      5. Partnership opportunities with their preferred vendors

      Return ONLY the JSON object, no additional text.`;

      userPrompt = `Create a personalized marketing strategy for this agent based on their current performance and future goals.`;
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

    // Handle response based on type
    const isComparison = validatedInput.type === 'quick' && (
      validatedInput.prompt.toLowerCase().includes('compare') || 
      validatedInput.prompt.toLowerCase().includes('vs') ||
      validatedInput.prompt.toLowerCase().includes('versus')
    );

    if (isComparison) {
      // For comparison requests, return the response directly
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
        locationAnalysis: validatedInput.type === 'detailed' 
          ? `Based on your ${currentPerformance.location || 'location'} market analysis, we've identified key opportunities for scaling from ${currentPerformance.dealVolume12m || 'current volume'} to ${futureGoals.targetVolume || 'target volume'}.`
          : "Based on the provided information, we've analyzed your market conditions and identified key opportunities for growth.",
        agentBuyingPatterns: validatedInput.type === 'detailed'
          ? `Your current ${currentPerformance.buyerDeals || '50'}%/${currentPerformance.sellerDeals || '50'}% buyer/seller split suggests opportunities for balanced growth. Agents targeting ${futureGoals.targetVolume || 'higher volume'} typically invest in lead generation and conversion systems.`
          : "Successful agents in similar markets typically invest in a combination of digital marketing and local community engagement strategies.",
        topROIBundle: {
          name: validatedInput.type === 'detailed' ? "Growth Acceleration Package" : "Digital Presence Package",
          description: validatedInput.type === 'detailed' 
            ? `Customized bundle to scale from ${currentPerformance.dealVolume12m || 'current volume'} to ${futureGoals.targetVolume || 'target volume'} within ${futureGoals.timeframe || '12 months'}`
            : "A comprehensive bundle designed to establish strong online presence and generate quality leads",
          services: [
            { name: "Lead Generation System", description: "Captures and nurtures potential clients automatically" },
            { name: "Social Media Management", description: "Builds brand awareness and engages local audience" },
            { name: "SEO Optimization", description: "Improves search visibility for local property searches" }
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