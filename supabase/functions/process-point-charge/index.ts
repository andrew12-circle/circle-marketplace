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
    const { 
      charge_id,
      stripe_customer_id,
      stripe_payment_method_id,
      amount_to_charge,
      points_charged,
      vendor_id
    } = await req.json();
    
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

    console.log(`Processing charge ${charge_id} for $${amount_to_charge}`);

    // Create payment intent with Stripe Radar
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount_to_charge * 100), // Convert to cents
      currency: 'usd',
      customer: stripe_customer_id,
      payment_method: stripe_payment_method_id,
      confirmation_method: 'automatic',
      confirm: true,
      off_session: true,
      description: `Circle Platform Points: ${points_charged} points`,
      metadata: {
        vendor_id: vendor_id,
        charge_id: charge_id,
        points_charged: points_charged.toString(),
        fraud_monitoring: 'enabled'
      },
      // Enable enhanced Radar monitoring
      radar_options: {
        session: `point_charge_${charge_id}`
      }
    });

    console.log(`Payment intent created: ${paymentIntent.id}, status: ${paymentIntent.status}`);

    // Check for fraud signals and log them
    if (paymentIntent.latest_charge) {
      const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
      const outcome = charge.outcome;
      
      if (outcome) {
        const riskScore = outcome.risk_score || 0;
        const riskLevel = outcome.risk_level || 'normal';
        
        console.log(`Risk assessment - Score: ${riskScore}, Level: ${riskLevel}, Type: ${outcome.type}`);
        
        // Log high-risk transactions
        if (riskScore >= 50 || outcome.type === 'manual_review') {
          await supabase.from('fraud_monitoring_logs').insert({
            transaction_id: paymentIntent.id,
            stripe_payment_intent_id: paymentIntent.id,
            stripe_charge_id: charge.id,
            risk_score: riskScore,
            risk_level: riskLevel,
            outcome_type: outcome.type,
            outcome_reason: outcome.reason,
            amount_cents: paymentIntent.amount,
            currency: paymentIntent.currency,
            metadata: paymentIntent.metadata,
            requires_action: paymentIntent.status === 'requires_action'
          });
        }
      }
    }

    // Update charge record
    const { error: updateError } = await supabase
      .from('point_charges')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        charge_status: paymentIntent.status,
        processed_at: new Date().toISOString()
      })
      .eq('id', charge_id);

    if (updateError) {
      console.error('Failed to update charge record:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: paymentIntent.status === 'succeeded',
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        amount_charged: amount_to_charge
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Process point charge error:', error);
    
    // If we have a charge_id, update it with the error
    if (req.json) {
      try {
        const { charge_id } = await req.json();
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        await supabase
          .from('point_charges')
          .update({
            charge_status: 'failed',
            error_message: error.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', charge_id);
      } catch (updateError) {
        console.error('Failed to update charge with error:', updateError);
      }
    }

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