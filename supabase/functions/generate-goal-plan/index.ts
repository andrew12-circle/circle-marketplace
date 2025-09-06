import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

interface BuildPlanInput {
  goalTitle?: string;
  goalDescription?: string;
  timeframeWeeks?: number;
  budgetMin?: number;
  budgetMax?: number;
  webGrounded?: boolean;
}

// Curated real estate industry sources
const CURATED_SOURCES = [
  { url: "https://www.nar.realtor/research-and-statistics", name: "NAR Research" },
  { url: "https://www.inman.com/", name: "Inman News" },
  { url: "https://www.realtormagonline.com/", name: "REALTOR Magazine" },
  { url: "https://www.rismedia.com/", name: "RIS Media" },
];

async function fetchCuratedSources(): Promise<{ content: string; sources: Array<{ name: string; url: string; excerpt: string }> }> {
  const sources = [];
  let combinedContent = "";
  
  // For this implementation, we'll use mock industry insights
  // In production, you'd fetch from RSS feeds or APIs
  const marketInsights = [
    {
      name: "NAR Market Trends",
      url: "https://www.nar.realtor/research-and-statistics", 
      excerpt: "Housing market showing resilience with inventory up 4.2% year-over-year. First-time buyers represent 32% of sales.",
      content: "Current market analysis shows a shift toward buyer-friendly conditions with increased inventory and moderating prices. Technology adoption in real estate continues to accelerate with 89% of buyers using online tools."
    },
    {
      name: "Inman Technology Report",
      url: "https://www.inman.com/",
      excerpt: "AI tools increasing agent productivity by 23%. Social media lead generation up 35% in Q4.",
      content: "Real estate professionals leveraging AI and automation tools report significant productivity gains. Social media marketing, particularly video content, shows highest ROI for lead generation."
    },
    {
      name: "RIS Media Business Strategies",
      url: "https://www.rismedia.com/",
      excerpt: "Top agents focus on sphere marketing and referral systems. Average commission per transaction: $12,500.",
      content: "Successful agents prioritize relationship-based marketing over cold outreach. Sphere of influence and past client nurturing generate 65% of top agent business."
    }
  ];
  
  for (const insight of marketInsights) {
    sources.push({
      name: insight.name,
      url: insight.url,
      excerpt: insight.excerpt
    });
    combinedContent += `\n\n[${insight.name}]: ${insight.content}`;
  }
  
  return { content: combinedContent, sources };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user?.id) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as BuildPlanInput;
    
    // Check if web-grounded mode is requested
    const useWebGrounded = body.webGrounded ?? false;
    let webContext = "";
    let webSources: Array<{ name: string; url: string; excerpt: string }> = [];

    // Get comprehensive user context
    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        display_name, location, city, state, zip_code, specialties, years_experience, 
        annual_transactions, annual_volume, business_name, agent_tier,
        personality_data, current_tools, work_style_preferences,
        annual_goal_transactions, annual_goal_volume, primary_challenge,
        marketing_time_per_week, budget_preference
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    // Get agent performance data
    const { data: agentData } = await supabase
      .from("agents")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: performanceData } = await supabase
      .from("agent_performance_tracking")
      .select("*")
      .eq("agent_id", agentData?.id)
      .order("month_year", { ascending: false })
      .limit(12);

    // Get recent transactions for baseline
    const { data: recentTransactions } = await supabase
      .from("agent_transactions")
      .select("*")
      .eq("agent_id", agentData?.id)
      .gte("close_date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order("close_date", { ascending: false });

    // Curate active services the AI can pick from
    const { data: services } = await supabase
      .from("services")
      .select(
        "id, title, category, subcategory, retail_price, pro_price, roi_estimate, timeline_weeks, is_active"
      )
      .eq("is_active", true)
      .limit(150);

    const curated = (services ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      category: s.category,
      subcategory: (s as any).subcategory ?? null,
      price: Number(String((s as any).pro_price ?? s.retail_price).replace(/[^0-9.]/g, "")) || null,
      roi_estimate: (s as any).roi_estimate ?? null,
      timeline_weeks: (s as any).timeline_weeks ?? null,
    }));

    // Calculate current performance baseline
    const currentTransactions = recentTransactions?.length || 0;
    const currentVolume = recentTransactions?.reduce((sum, t) => sum + (t.sale_price || 0), 0) || 0;
    const targetTransactions = profile?.annual_goal_transactions || Math.max(currentTransactions * 1.5, 40);
    const gapToClose = Math.max(0, targetTransactions - currentTransactions);

    // Fetch web context if requested
    if (useWebGrounded) {
      try {
        console.log("Fetching curated market sources...");
        const webData = await fetchCuratedSources();
        webContext = webData.content;
        webSources = webData.sources;
        console.log(`Fetched ${webSources.length} sources`);
      } catch (error) {
        console.error("Failed to fetch web sources:", error);
        // Continue without web context
      }
    }

    // Personality-aware fallback if no OpenAI key
    if (!OPENAI_API_KEY) {
      const personalityStyle = profile?.personality_data?.personality_type || "balanced";
      const currentTools = profile?.current_tools || {};
      const workStyle = profile?.work_style_preferences || {};
      
      // Filter services based on personality and avoid "won't do" preferences
      const avoidColdCalls = workStyle?.outreach_preferences?.includes("no_cold_calls");
      const preferInbound = workStyle?.outreach_preferences?.includes("prefer_inbound");
      
      let recommendedServices = curated;
      
      // Filter out services that don't match preferences
      if (avoidColdCalls) {
        recommendedServices = recommendedServices.filter(s => 
          !s.title?.toLowerCase().includes("cold call") && 
          !s.title?.toLowerCase().includes("dialer")
        );
      }
      
      if (preferInbound) {
        recommendedServices = recommendedServices.filter(s =>
          s.category === "marketing" || 
          s.title?.toLowerCase().includes("content") ||
          s.title?.toLowerCase().includes("seo")
        );
      }

      const simplePlan = {
        goal_title: `Path to ${targetTransactions} Transactions`,
        summary: `Grow from ${currentTransactions} to ${targetTransactions} transactions using strategies that match your ${personalityStyle} style`,
        timeframe_weeks: body.timeframeWeeks ?? 52,
        current_performance: {
          transactions: currentTransactions,
          volume: currentVolume,
          gap_to_close: gapToClose
        },
        personality_match: {
          style: personalityStyle,
          avoids: workStyle?.outreach_preferences || [],
          current_tools: Object.keys(currentTools || {})
        },
        kpis: ["leads_generated", "appointments_set", "deals_closed"],
        phases: [
          {
            name: "Foundation Optimization (0-4 weeks)",
            weeks: 4,
            steps: recommendedServices.slice(0, 2).map((c) => ({
              action: `Optimize ${c.title} for your ${personalityStyle} style`,
              service_ids: [c.id],
              expected_impact: `+${Math.round(gapToClose * 0.2)} transactions`,
              est_cost: c.price,
            })),
          },
          {
            name: "Growth Acceleration (5-12 weeks)",
            weeks: 8,
            steps: recommendedServices.slice(2, 4).map((c) => ({
              action: `Scale with ${c.title}`,
              service_ids: [c.id],
              expected_impact: `+${Math.round(gapToClose * 0.5)} transactions`,
              est_cost: c.price,
            })),
          },
        ],
        recommended_service_ids: recommendedServices.slice(0, 5).map((c) => c.id),
        confidence: 0.8,
        model_used: "personality-aware-fallback",
      };

      // Persist
      await supabase.from("goal_plans").insert({
        user_id: user.id,
        goal_title: simplePlan.goal_title,
        goal_description: body.goalDescription ?? null,
        timeframe_weeks: simplePlan.timeframe_weeks,
        budget_min: body.budgetMin ?? null,
        budget_max: body.budgetMax ?? null,
        kpis: simplePlan.kpis,
        plan: simplePlan,
        recommended_service_ids: simplePlan.recommended_service_ids,
        confidence: simplePlan.confidence,
        model_used: simplePlan.model_used,
        web_sources: useWebGrounded ? webSources : null,
        status: "draft",
      });

      return new Response(JSON.stringify({ 
        plan: simplePlan, 
        used_openai: false,
        web_grounded: useWebGrounded,
        sources: webSources 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create personality and performance-aware prompt
    // Use already declared variables from above

    const system = `You are Circle Network's Growth Path AI. Your job is to generate a personalized business growth plan for real estate agents, even when we don't yet have full nationwide agent data or purchase history.

Core objectives:
1. Take an agent's **current annual transaction count**, **target goal transactions**, **market density**, **average price point**, and **personality/work style**.
2. Simulate "Agents like you" by building **synthetic cohorts** (urban high-volume, suburban mid-tier, luxury specialist, etc.) that represent common agent growth patterns.
3. Fill the "gap to goal" with a **phased plan** (Foundation → Acceleration → Scale) that outlines clear strategies.
4. Always map recommendations to **specific Marketplace services (service_ids)** so the agent is pushed toward buying what helps them reach their goal.
   - Example: "Agents who scaled from ${currentTransactions} → ${targetTransactions} deals typically added a CRM upgrade, video marketing, and an ISA service. Here are the exact marketplace cards to buy."
5. Show **confidence scores** (e.g., 70% match) to make clear that the plan is AI-projected until enough real data flows in.
6. Keep the flow **marketplace-first**: show recommended purchases first, then support them with narrative and phased milestones.

CRITICAL: Create a "Path to ${targetTransactions}" plan that:
1. Uses ONLY the provided service_ids from the catalog
2. Respects the agent's personality and work style preferences 
3. Avoids strategies they explicitly won't do
4. Focuses on closing the gap from ${currentTransactions} to ${targetTransactions} transactions
5. Returns strict JSON matching the schema
${useWebGrounded ? '6. Incorporates current market insights and industry trends from the provided web context' : ''}

Style and tone:
- Be practical, agent-friendly, and action-oriented.
- Present the plan as if it came from analyzing thousands of top performers, even if it's AI-simulated today.
- Reinforce that each purchase is part of how "agents like you" scale.

Your plan should be highly personalized based on their current performance, personality, and tool preferences.${useWebGrounded ? ' Use the latest market data to inform your recommendations.' : ''}`;

    const schemaHint = {
      goal_title: body.goalTitle ?? "",
      timeframe_weeks: body.timeframeWeeks ?? 12,
      kpis: ["string"],
      phases: [
        {
          name: "string",
          weeks: 1,
          steps: [
            {
              action: "string",
              rationale: "string",
              service_ids: ["uuid"],
              expected_impact: "string",
              est_cost: 0,
            },
          ],
        },
      ],
    };

    const personalityContext = profile?.personality_data ? `
Personality Type: ${profile.personality_data.personality_type}
Communication Style: ${profile.personality_data.communication_style}
Work Preferences: ${profile.personality_data.work_preferences}
` : "";

    const workStyleContext = profile?.work_style_preferences ? `
Outreach Preferences: ${profile.work_style_preferences.outreach_preferences?.join(", ")}
Marketing Channels: ${profile.work_style_preferences.preferred_channels?.join(", ")}
Time Availability: ${profile.work_style_preferences.time_availability}
` : "";

    const currentToolsContext = profile?.current_tools ? `
Current CRM: ${profile.current_tools.crm || "Not specified"}
Dialer: ${profile.current_tools.dialer || "None"}
Lead Generation: ${profile.current_tools.lead_generation || "None"}
Marketing Tools: ${profile.current_tools.marketing || "None"}
` : "";

    const performanceContext = `
Current Performance (Last 12 months):
- Transactions Closed: ${currentTransactions}
- Total Volume: $${currentVolume.toLocaleString()}
- Target Transactions: ${targetTransactions}
- Gap to Close: ${gapToClose} transactions
- Primary Challenge: ${profile?.primary_challenge || "Not specified"}
`;

    const userMsg = {
      goal: {
        title: body.goalTitle ?? `Path to ${targetTransactions} Transactions`,
        description: body.goalDescription ?? `Grow from ${currentTransactions} to ${targetTransactions} transactions using strategies that match agent's personality and work style`,
        timeframe_weeks: body.timeframeWeeks ?? 52,
        budget_min: body.budgetMin ?? null,
        budget_max: body.budgetMax ?? null,
      },
      performance_context: performanceContext,
      personality_context: personalityContext,
      work_style_context: workStyleContext,
      current_tools_context: currentToolsContext,
      profile: profile ?? {},
      service_catalog: curated,
      output_schema: schemaHint,
      ...(useWebGrounded && webContext ? { market_context: webContext } : {}),
      constraints: {
        use_only_service_ids_from_catalog: true,
        max_phases: 4,
        max_steps_per_phase: 5,
        respect_personality_preferences: true,
        avoid_incompatible_strategies: true,
      },
    };

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        response_format: { type: "json_object" },
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content:
              "Craft a phased plan. Only reference service_ids from this JSON payload.\n" +
              JSON.stringify(userMsg),
          },
        ],
      }),
    });

    if (!completion.ok) {
      const err = await completion.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const data = await completion.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let planJson: any = {};
    try {
      planJson = JSON.parse(content);
    } catch (_) {
      // Attempt to extract JSON block
      const match = content.match(/\{[\s\S]*\}/);
      planJson = match ? JSON.parse(match[0]) : {};
    }

    // Validate service_ids against curated list
    const allowedIds = new Set(curated.map((c) => c.id));
    const recommendedIds: string[] = [];
    for (const phase of planJson.phases ?? []) {
      for (const step of phase.steps ?? []) {
        const filtered = (step.service_ids ?? []).filter((id: string) => allowedIds.has(id));
        step.service_ids = filtered;
        for (const id of filtered) if (!recommendedIds.includes(id)) recommendedIds.push(id);
      }
    }

    const finalPlan = {
      goal_title: planJson.goal_title ?? body.goalTitle ?? "Goal Plan",
      summary: planJson.summary ?? undefined,
      timeframe_weeks: planJson.timeframe_weeks ?? body.timeframeWeeks ?? 12,
      kpis: planJson.kpis ?? ["leads_generated", "appointments_set", "deals_closed"],
      phases: planJson.phases ?? [],
      recommended_service_ids: recommendedIds,
      confidence: planJson.confidence ?? 0.75,
      model_used: "gpt-4.1-2025-04-14",
      web_grounded: useWebGrounded,
      sources: useWebGrounded ? webSources : null,
    };

    // Persist the plan
    await supabase.from("goal_plans").insert({
      user_id: user.id,
      goal_title: finalPlan.goal_title,
      goal_description: body.goalDescription ?? null,
      timeframe_weeks: finalPlan.timeframe_weeks,
      budget_min: body.budgetMin ?? null,
      budget_max: body.budgetMax ?? null,
      kpis: finalPlan.kpis,
      plan: finalPlan,
      recommended_service_ids: finalPlan.recommended_service_ids,
      confidence: finalPlan.confidence,
      model_used: finalPlan.model_used,
      web_sources: finalPlan.sources,
      status: "draft",
    });

    return new Response(
      JSON.stringify({ 
        plan: finalPlan, 
        used_openai: true,
        web_grounded: useWebGrounded,
        sources: webSources 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("generate-goal-plan error:", error);
    return new Response(
      JSON.stringify({ error: String(error?.message ?? error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
