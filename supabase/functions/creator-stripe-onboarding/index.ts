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
    if (!user?.email) throw new Error("User not authenticated or email not available");

    console.log(`Creating Stripe Connect account for user: ${user.id}`);

    // Get user profile info
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, business_name")
      .eq("user_id", user.id)
      .single();

    // Check if user already has a Stripe account
    const { data: existingPaymentInfo } = await supabase
      .from("creator_payment_info")
      .select("stripe_account_id")
      .eq("creator_id", user.id)
      .single();

    let accountId = existingPaymentInfo?.stripe_account_id;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        business_profile: {
          name: profile?.business_name || profile?.display_name || "Creator Account",
        },
        capabilities: {
          transfers: { requested: true },
        },
      });

      accountId = account.id;
      console.log(`Created Stripe account: ${accountId}`);

      // Save to database
      await supabase
        .from("creator_payment_info")
        .upsert({
          creator_id: user.id,
          stripe_account_id: accountId,
          payment_method: "stripe",
          verified: false,
          stripe_onboarding_completed: false,
        });
    }

    // Create account link for onboarding
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/creator-dashboard?refresh=true`,
      return_url: `${origin}/creator-dashboard?success=true`,
      type: "account_onboarding",
    });

    console.log(`Created account link: ${accountLink.url}`);

    return new Response(
      JSON.stringify({
        success: true,
        account_id: accountId,
        onboarding_url: accountLink.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Stripe onboarding error:", error);
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