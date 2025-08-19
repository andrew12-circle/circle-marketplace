import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-DONATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const { amount, donorName, donorEmail, userId } = await req.json();
    
    if (!amount || amount < 100) { // Minimum $1.00
      throw new Error("Donation amount must be at least $1.00");
    }
    
    if (!donorEmail) {
      throw new Error("Donor email is required");
    }

    logStep("Request data validated", { amount, donorName, donorEmail, userId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ 
      email: donorEmail,
      limit: 1 
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
      logStep("Found existing customer", { customerId: customer.id });
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: donorEmail,
        name: donorName || 'Anonymous Donor',
        metadata: {
          donor_type: 'ministry_supporter',
          user_id: userId || 'guest'
        }
      });
      logStep("Created new customer", { customerId: customer.id });
    }

    // Create checkout session for one-time donation
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Circle Ministry Donation",
              description: "Supporting Kingdom-focused ministries and missions"
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin") || "https://ihzyuyfawapweamqzzlj.lovable.app"}/ministry/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin") || "https://ihzyuyfawapweamqzzlj.lovable.app"}/ministry`,
      metadata: {
        donation_type: "ministry_support",
        donor_name: donorName || "Anonymous",
        user_id: userId || "guest"
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Initialize Supabase client with service role for logging
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Log the donation attempt (optional - could create a donations table)
    try {
      await supabase.from("donation_attempts").insert({
        stripe_session_id: session.id,
        donor_email: donorEmail,
        donor_name: donorName || "Anonymous",
        amount_cents: amount,
        user_id: userId,
        status: "pending",
        created_at: new Date().toISOString()
      });
      logStep("Logged donation attempt to database");
    } catch (dbError) {
      // Don't fail the whole process if logging fails
      console.warn("Failed to log donation attempt:", dbError);
    }

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-donation", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});