import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    // Parse request body
    const { playbookId } = await req.json();
    
    if (!playbookId) {
      throw new Error("Playbook ID is required");
    }

    // Get playbook details
    const { data: playbook, error: playbookError } = await supabaseClient
      .from('content')
      .select(`
        *,
        profiles:creator_id (display_name)
      `)
      .eq('id', playbookId)
      .eq('is_agent_playbook', true)
      .eq('is_published', true)
      .single();

    if (playbookError || !playbook) {
      throw new Error("Playbook not found or not available for purchase");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer exists for this user
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session for playbook purchase
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `Agent Playbook: ${playbook.title}`,
              description: playbook.description,
              images: playbook.thumbnail_url ? [playbook.thumbnail_url] : undefined
            },
            unit_amount: Math.round(playbook.playbook_price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/academy/purchase-success?session_id={CHECKOUT_SESSION_ID}&playbook_id=${playbookId}`,
      cancel_url: `${req.headers.get("origin")}/academy/playbooks/${playbookId}`,
      metadata: {
        playbook_id: playbookId,
        buyer_id: user.id,
        creator_id: playbook.creator_id,
        revenue_share_percentage: playbook.revenue_share_percentage.toString()
      }
    });

    // Record the pending purchase
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseService.from("playbook_purchases").insert({
      buyer_id: user.id,
      playbook_id: playbookId,
      creator_id: playbook.creator_id,
      stripe_session_id: session.id,
      amount: playbook.playbook_price,
      status: "pending",
      revenue_share_percentage: playbook.revenue_share_percentage
    });

    console.log(`Created checkout session ${session.id} for playbook ${playbookId}`);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error creating playbook payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});