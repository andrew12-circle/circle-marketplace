import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Helper function to log fraud events
async function logFraudEvent(supabase: any, paymentIntent: any, charge: any) {
  const outcome = charge.outcome || {};
  const riskScore = outcome.risk_score || 0;
  const riskLevel = outcome.risk_level || 'normal';
  
  // Determine if this requires action
  const requiresAction = paymentIntent.status === 'requires_action' || 
                        paymentIntent.status === 'requires_payment_method' ||
                        outcome.type === 'manual_review';

  // Extract fraud details
  const fraudDetails = {
    cvc_check: charge.payment_method_details?.card?.checks?.cvc_check,
    address_line1_check: charge.payment_method_details?.card?.checks?.address_line1_check,
    address_postal_code_check: charge.payment_method_details?.card?.checks?.address_postal_code_check,
    three_d_secure: charge.payment_method_details?.card?.three_d_secure,
    radar_session: paymentIntent.radar_options?.session,
  };

  // Create fraud monitoring log
  const { data: fraudLog, error: logError } = await supabase
    .from('fraud_monitoring_logs')
    .insert({
      transaction_id: paymentIntent.id,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: charge.id,
      risk_score: riskScore,
      risk_level: riskLevel,
      outcome_type: outcome.type,
      outcome_reason: outcome.reason,
      radar_rules_triggered: outcome.rule || [],
      amount_cents: paymentIntent.amount,
      currency: paymentIntent.currency,
      customer_email: paymentIntent.receipt_email,
      payment_method_details: charge.payment_method_details || {},
      billing_details: charge.billing_details || {},
      metadata: paymentIntent.metadata || {},
      requires_action: requiresAction,
      fraud_details: fraudDetails
    })
    .select()
    .single();

  if (logError) {
    console.error('Failed to create fraud log:', logError);
    return null;
  }

  // Create alerts for high-risk transactions
  if (riskScore >= 60 || riskLevel === 'highest' || outcome.type === 'manual_review') {
    const alertType = outcome.type === 'manual_review' ? 'manual_review_required' :
                     outcome.type === 'blocked' ? 'blocked_payment' :
                     'high_risk_score';
    
    const severity = riskScore >= 80 ? 'critical' :
                    riskScore >= 60 ? 'high' :
                    outcome.type === 'manual_review' ? 'high' :
                    'medium';

    const alertMessage = `${alertType.replace('_', ' ').toUpperCase()}: Risk score ${riskScore}, Level: ${riskLevel}`;

    await supabase.from('fraud_alerts').insert({
      fraud_log_id: fraudLog.id,
      alert_type: alertType,
      severity: severity,
      alert_message: alertMessage,
      alert_data: {
        risk_score: riskScore,
        risk_level: riskLevel,
        outcome_type: outcome.type,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      }
    });
  }

  return fraudLog;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify webhook signature
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    console.log(`Processing Stripe event: ${event.type}`);

    // Store the raw event
    await supabase.from('stripe_radar_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payment_intent_id: event.data.object.payment_intent || event.data.object.id,
      charge_id: event.data.object.id,
      customer_id: event.data.object.customer,
      event_data: event.data.object
    });

    // Process different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'charge.succeeded':
      case 'charge.failed': {
        const object = event.data.object;
        
        if (event.type.startsWith('payment_intent')) {
          // Get the charge from the payment intent
          const charges = await stripe.charges.list({
            payment_intent: object.id,
            limit: 1
          });
          
          if (charges.data.length > 0) {
            await logFraudEvent(supabase, object, charges.data[0]);
          }
        } else {
          // This is a charge event
          const paymentIntent = await stripe.paymentIntents.retrieve(object.payment_intent);
          await logFraudEvent(supabase, paymentIntent, object);
        }
        break;
      }

      case 'radar.early_fraud_warning.created': {
        const fraudWarning = event.data.object;
        
        // Create critical alert for early fraud warning
        await supabase.from('fraud_alerts').insert({
          alert_type: 'chargeback_warning',
          severity: 'critical',
          alert_message: `Early fraud warning for charge ${fraudWarning.charge}`,
          alert_data: {
            charge_id: fraudWarning.charge,
            fraud_type: fraudWarning.fraud_type,
            actionable: fraudWarning.actionable
          }
        });
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object;
        
        // Create critical alert for chargeback
        await supabase.from('fraud_alerts').insert({
          alert_type: 'chargeback_warning',
          severity: 'critical',
          alert_message: `Chargeback created for charge ${dispute.charge}`,
          alert_data: {
            charge_id: dispute.charge,
            amount: dispute.amount,
            currency: dispute.currency,
            reason: dispute.reason,
            status: dispute.status
          }
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await supabase
      .from('stripe_radar_events')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq('stripe_event_id', event.id);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});