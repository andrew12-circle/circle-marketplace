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
    const { vendor_id } = await req.json();
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get vendor profile
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', vendor_id)
      .single();

    if (profileError || !profile) {
      throw new Error('Vendor profile not found');
    }

    // Get vendor email from auth.users
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(vendor_id);
    if (userError || !user?.email) {
      throw new Error('Vendor email not found');
    }

    // Check if customer already exists
    const customers = await stripe.customers.list({ 
      email: user.email,
      limit: 1 
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: user.email,
        name: profile.business_name || profile.display_name || 'Vendor',
        metadata: {
          vendor_id: vendor_id,
          platform: 'circle_platform'
        }
      });
    }

    // Create setup intent for storing payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        vendor_id: vendor_id,
        purpose: 'points_allocation'
      }
    });

    return new Response(
      JSON.stringify({
        setup_intent_client_secret: setupIntent.client_secret,
        customer_id: customer.id,
        setup_intent_id: setupIntent.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Setup vendor payment error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});