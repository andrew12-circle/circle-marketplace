import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-AFFILIATE-PAYOUTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Initialize Supabase with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    // Verify admin status
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", userData.user.id)
      .single();

    if (!profile?.is_admin) {
      throw new Error("Access denied: Admin privileges required");
    }

    logStep("Admin authentication verified", { userId: userData.user.id });

    // Get pending payouts for Stripe processing
    const { data: pendingPayouts, error: payoutsError } = await supabase
      .from("affiliate_payouts")
      .select(`
        *,
        affiliates!inner (
          id,
          email,
          legal_name,
          payout_method,
          tax_status
        )
      `)
      .eq("payout_status", "pending")
      .eq("payout_method", "stripe");

    if (payoutsError) {
      throw new Error(`Error fetching payouts: ${payoutsError.message}`);
    }

    if (!pendingPayouts || pendingPayouts.length === 0) {
      logStep("No pending Stripe payouts found");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No pending Stripe payouts to process",
          processed: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Found pending payouts", { count: pendingPayouts.length });

    const processedPayouts = [];
    const failedPayouts = [];

    // Process each payout
    for (const payout of pendingPayouts) {
      try {
        logStep("Processing payout", { payoutId: payout.id, amount: payout.payout_amount });

        // Find or create Stripe customer for affiliate
        const affiliate = payout.affiliates;
        let customerId = null;

        const existingCustomers = await stripe.customers.list({
          email: affiliate.email,
          limit: 1
        });

        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
          logStep("Found existing Stripe customer", { customerId });
        } else {
          // Create new customer
          const customer = await stripe.customers.create({
            email: affiliate.email,
            name: affiliate.legal_name,
            metadata: {
              affiliate_id: affiliate.id,
              payout_processing: "true"
            }
          });
          customerId = customer.id;
          logStep("Created new Stripe customer", { customerId });
        }

        // For now, we'll create a payment intent that can be used for manual payouts
        // In a full implementation, you'd typically use Stripe Connect for automatic payouts
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(payout.payout_amount * 100), // Convert to cents
          currency: "usd",
          customer: customerId,
          payment_method_types: ["card"],
          metadata: {
            type: "affiliate_payout",
            affiliate_id: affiliate.id,
            payout_id: payout.id,
            period: `${payout.period_start} to ${payout.period_end}`
          },
          description: `Affiliate commission payout for ${affiliate.legal_name} (${payout.period_start} to ${payout.period_end})`
        });

        logStep("Created payment intent", { paymentIntentId: paymentIntent.id });

        // Update payout status
        const { error: updateError } = await supabase
          .from("affiliate_payouts")
          .update({
            payout_status: "processing",
            payout_reference: paymentIntent.id,
            updated_at: new Date().toISOString()
          })
          .eq("id", payout.id);

        if (updateError) {
          throw new Error(`Failed to update payout status: ${updateError.message}`);
        }

        processedPayouts.push({
          payout_id: payout.id,
          affiliate_email: affiliate.email,
          amount: payout.payout_amount,
          stripe_payment_intent: paymentIntent.id,
          status: "processing"
        });

        logStep("Successfully processed payout", { 
          payoutId: payout.id, 
          paymentIntentId: paymentIntent.id 
        });

      } catch (error) {
        logStep("Failed to process payout", { 
          payoutId: payout.id, 
          error: error.message 
        });

        // Update payout status to failed
        await supabase
          .from("affiliate_payouts")
          .update({
            payout_status: "failed",
            updated_at: new Date().toISOString()
          })
          .eq("id", payout.id);

        failedPayouts.push({
          payout_id: payout.id,
          affiliate_email: payout.affiliates.email,
          amount: payout.payout_amount,
          error: error.message
        });
      }
    }

    logStep("Payout processing completed", {
      processed: processedPayouts.length,
      failed: failedPayouts.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedPayouts.length,
        failed: failedPayouts.length,
        processedPayouts,
        failedPayouts
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    logStep("ERROR in process-affiliate-stripe-payouts", { message: error.message });
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