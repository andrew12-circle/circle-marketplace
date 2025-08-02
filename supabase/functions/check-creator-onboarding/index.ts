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

    // Get the authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    console.log(`Checking onboarding status for user: ${user.id}`);

    // Get creator payment info
    const { data: paymentInfo } = await supabase
      .from("creator_payment_info")
      .select("stripe_account_id, stripe_onboarding_completed, verified")
      .eq("creator_id", user.id)
      .single();

    if (!paymentInfo?.stripe_account_id) {
      return new Response(
        JSON.stringify({
          success: true,
          onboarding_completed: false,
          verified: false,
          needs_setup: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check Stripe account status
    const account = await stripe.accounts.retrieve(paymentInfo.stripe_account_id);
    
    const onboardingCompleted = account.details_submitted && account.charges_enabled;
    const canReceivePayouts = account.payouts_enabled;

    console.log(`Account status: onboarding=${onboardingCompleted}, payouts=${canReceivePayouts}`);

    // Update database if status changed
    if (onboardingCompleted !== paymentInfo.stripe_onboarding_completed || 
        canReceivePayouts !== paymentInfo.verified) {
      await supabase
        .from("creator_payment_info")
        .update({
          stripe_onboarding_completed: onboardingCompleted,
          verified: canReceivePayouts,
          updated_at: new Date().toISOString(),
        })
        .eq("creator_id", user.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        onboarding_completed: onboardingCompleted,
        verified: canReceivePayouts,
        needs_setup: false,
        account_id: paymentInfo.stripe_account_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Check onboarding error:", error);
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