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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Parse request body
    const { sessionId, playbookId } = await req.json();
    
    if (!sessionId || !playbookId) {
      throw new Error("Session ID and Playbook ID are required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    // Use service role to update the purchase record
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Update purchase status
    const { data: purchase, error: updateError } = await supabaseService
      .from("playbook_purchases")
      .update({
        status: "completed",
        stripe_payment_intent_id: session.payment_intent,
        completed_at: new Date().toISOString()
      })
      .eq("stripe_session_id", sessionId)
      .eq("buyer_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating purchase:", updateError);
      throw new Error("Failed to update purchase record");
    }

    // Calculate revenue split
    const creatorEarnings = purchase.amount * (purchase.revenue_share_percentage / 100);
    const platformFee = purchase.amount - creatorEarnings;

    // Record the revenue split
    await supabaseService.from("creator_earnings").insert({
      creator_id: purchase.creator_id,
      playbook_id: playbookId,
      purchase_id: purchase.id,
      gross_amount: purchase.amount,
      creator_earnings: creatorEarnings,
      platform_fee: platformFee,
      stripe_payment_intent_id: session.payment_intent
    });

    // Grant access to the playbook
    await supabaseService.from("playbook_access").insert({
      user_id: user.id,
      playbook_id: playbookId,
      purchase_id: purchase.id,
      access_granted_at: new Date().toISOString()
    });

    console.log(`Verified purchase ${purchase.id} for playbook ${playbookId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        purchase_id: purchase.id,
        access_granted: true
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error verifying purchase:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});