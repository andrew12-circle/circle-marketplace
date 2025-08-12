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

    // Load profile context (lightweight)
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "display_name, location, city, state, zip_code, specialties, years_experience, annual_transactions, annual_volume, business_name, agent_tier"
      )
      .eq("user_id", user.id)
      .maybeSingle();

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

    // Fallback local recommendation if no key
    if (!OPENAI_API_KEY) {
      const simplePlan = {
        goal_title: body.goalTitle ?? "Growth plan",
        summary:
          "AI key missing; generated a basic staged plan using your catalog.",
        timeframe_weeks: body.timeframeWeeks ?? 12,
        kpis: ["leads_generated", "appointments_set", "deals_closed"],
        phases: [
          {
            name: "Foundation",
            weeks: 1,
            steps: curated.slice(0, 3).map((c) => ({
              action: `Evaluate and prepare for ${c.title}`,
              service_ids: [c.id],
              expected_impact: "setup",
              est_cost: c.price,
            })),
          },
        ],
        recommended_service_ids: curated.slice(0, 5).map((c) => c.id),
        confidence: 0.4,
        model_used: "local-fallback",
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
        status: "draft",
      });

      return new Response(JSON.stringify({ plan: simplePlan, used_openai: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Build prompt for OpenAI: force JSON response that references only provided service IDs
    const system = `You are a senior growth strategist for real estate professionals.
Create an actionable, phased plan that achieves the user's goal using ONLY the provided service_ids from the catalog.
Use outside knowledge for strategy, sequencing, and KPIs, but all purchases must map to provided service_ids.
Always return strict JSON matching the schema.`;

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

    const userMsg = {
      goal: {
        title: body.goalTitle ?? "",
        description: body.goalDescription ?? "",
        timeframe_weeks: body.timeframeWeeks ?? 12,
        budget_min: body.budgetMin ?? null,
        budget_max: body.budgetMax ?? null,
      },
      profile: profile ?? {},
      service_catalog: curated,
      output_schema: schemaHint,
      constraints: {
        use_only_service_ids_from_catalog: true,
        max_phases: 4,
        max_steps_per_phase: 5,
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
      status: "draft",
    });

    return new Response(
      JSON.stringify({ plan: finalPlan, used_openai: true }),
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
