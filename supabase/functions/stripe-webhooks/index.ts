import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOKS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !endpointSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
      logStep("Webhook signature verified", { type: event.type, id: event.id });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    // Log the webhook event
    const { error: logError } = await supabaseClient
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        raw_data: event,
        processed: false
      });

    if (logError) {
      logStep("Failed to log webhook event", { error: logError });
    }

    // Process the event
    try {
      await processWebhookEvent(event, supabaseClient, stripe);
      
      // Mark as processed
      await supabaseClient
        .from('webhook_events')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq('stripe_event_id', event.id);

      logStep("Webhook processed successfully", { type: event.type });
    } catch (error) {
      logStep("Webhook processing failed", { error: error.message, type: event.type });
      
      // Mark as failed
      await supabaseClient
        .from('webhook_events')
        .update({ 
          processed: false,
          processing_error: error.message,
          processed_at: new Date().toISOString()
        })
        .eq('stripe_event_id', event.id);

      throw error;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhooks", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function processWebhookEvent(event: Stripe.Event, supabase: any, stripe: Stripe) {
  logStep("Processing event", { type: event.type });

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase, stripe);
      break;
    
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(event.data.object as Stripe.Subscription, supabase);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
      break;
    
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice, supabase);
      break;
    
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase);
      break;
    
    default:
      logStep("Unhandled webhook event type", { type: event.type });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: any, stripe: Stripe) {
  logStep("Processing checkout completion", { sessionId: session.id });
  
  if (session.mode === 'subscription' && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    await handleSubscriptionChange(subscription, supabase);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription, supabase: any) {
  const userId = subscription.metadata?.user_id;
  const customerId = subscription.customer as string;
  
  if (!userId) {
    logStep("No user_id in subscription metadata", { subscriptionId: subscription.id });
    return;
  }

  // Determine plan details from price
  const priceId = subscription.items.data[0]?.price.id;
  const interval = subscription.items.data[0]?.price.recurring?.interval || 'month';
  const subscriptionTier = subscription.metadata?.subscription_tier || 'Pro';
  
  logStep("Updating subscription", { 
    userId, 
    subscriptionId: subscription.id, 
    status: subscription.status,
    interval,
    priceId
  });

  // Upsert subscriber record
  const { error } = await supabase
    .from('subscribers')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_tier: subscriptionTier,
      plan_interval: interval,
      pro_price_id: priceId,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      subscription_created_at: new Date(subscription.created * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    logStep("Failed to update subscriber", { error, userId });
    throw new Error(`Failed to update subscriber: ${error.message}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  const userId = subscription.metadata?.user_id;
  
  if (!userId) {
    logStep("No user_id in subscription metadata for deletion", { subscriptionId: subscription.id });
    return;
  }

  logStep("Handling subscription deletion", { userId, subscriptionId: subscription.id });

  const { error } = await supabase
    .from('subscribers')
    .update({
      subscription_status: 'canceled',
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    logStep("Failed to update subscriber on deletion", { error, userId });
    throw new Error(`Failed to update subscriber on deletion: ${error.message}`);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice, supabase: any) {
  logStep("Processing successful payment", { invoiceId: invoice.id });
  
  if (invoice.subscription) {
    // Update payment status - could be used for tracking
    logStep("Payment successful for subscription", { subscriptionId: invoice.subscription });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  logStep("Processing failed payment", { invoiceId: invoice.id });
  
  if (invoice.subscription) {
    // Could implement dunning management here
    logStep("Payment failed for subscription", { subscriptionId: invoice.subscription });
  }
}