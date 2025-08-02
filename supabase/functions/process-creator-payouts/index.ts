import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payout_month } = await req.json();

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log(`Processing payouts for month: ${payout_month || 'current'}`);

    // Get pending payouts
    const { data: pendingPayouts } = await supabase
      .from("creator_payouts")
      .select(`
        *,
        creator_payment_info:creator_id (
          stripe_account_id,
          verified,
          payment_method
        )
      `)
      .eq("status", "pending")
      .eq("payout_month", payout_month || new Date().toISOString().slice(0, 7))
      .gte("final_amount", 25); // Minimum payout threshold

    if (!pendingPayouts || pendingPayouts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending payouts found",
          processed: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    let processed = 0;
    let failed = 0;

    for (const payout of pendingPayouts) {
      try {
        const paymentInfo = payout.creator_payment_info;
        
        if (!paymentInfo?.stripe_account_id || !paymentInfo?.verified) {
          console.log(`Skipping payout ${payout.id}: account not verified`);
          await supabase
            .from("creator_payouts")
            .update({
              status: "requires_setup",
              error_message: "Stripe account not verified",
              updated_at: new Date().toISOString(),
            })
            .eq("id", payout.id);
          continue;
        }

        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
          amount: Math.round(payout.final_amount * 100), // Convert to cents
          currency: "usd",
          destination: paymentInfo.stripe_account_id,
          description: `Creator payout for ${payout.payout_month}`,
          metadata: {
            creator_id: payout.creator_id,
            payout_id: payout.id,
            payout_month: payout.payout_month,
          },
        });

        console.log(`Transfer created: ${transfer.id} for $${payout.final_amount}`);

        // Update payout record
        await supabase
          .from("creator_payouts")
          .update({
            status: "completed",
            payment_processor_id: transfer.id,
            payment_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", payout.id);

        processed++;

      } catch (error) {
        console.error(`Failed to process payout ${payout.id}:`, error);
        
        // Update payout with error
        await supabase
          .from("creator_payouts")
          .update({
            status: "failed",
            error_message: error.message,
            retry_count: (payout.retry_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payout.id);

        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processed} payouts, ${failed} failed`,
        processed,
        failed,
        total: pendingPayouts.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Process payouts error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});