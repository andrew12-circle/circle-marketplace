import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { session_id } = await req.json();
    
    if (!session_id) {
      throw new Error("session_id is required");
    }

    logStep("Verifying session", { sessionId: session_id });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Retrieved Stripe session", { 
      status: session.payment_status, 
      paymentIntent: session.payment_intent 
    });

    // Find the order in our database
    const { data: orderData, error: orderError } = await supabaseService
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          service_id,
          vendor_id,
          item_type,
          item_title,
          item_price,
          quantity,
          vendor_commission_percentage
        )
      `)
      .eq('stripe_session_id', session_id)
      .single();

    if (orderError || !orderData) {
      logStep("Order not found", { error: orderError });
      throw new Error("Order not found");
    }

    logStep("Found order", { orderId: orderData.id, currentStatus: orderData.status });

    // Update order status based on payment status
    let newStatus = orderData.status;
    let paidAt = null;

    if (session.payment_status === 'paid') {
      newStatus = 'paid';
      paidAt = new Date().toISOString();
      logStep("Payment confirmed - updating to paid");
    } else if (session.payment_status === 'unpaid') {
      newStatus = 'failed';
      logStep("Payment failed - updating to failed");
    }

    // Update order status
    const { error: updateError } = await supabaseService
      .from('orders')
      .update({ 
        status: newStatus,
        paid_at: paidAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderData.id);

    if (updateError) {
      logStep("Failed to update order", { error: updateError });
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // If payment is successful, log purchase events for tracking
    if (newStatus === 'paid' && orderData.order_items) {
      logStep("Logging purchase events", { itemCount: orderData.order_items.length });

      for (const item of orderData.order_items) {
        // Log service tracking event
        await supabaseService
          .from('service_tracking_events')
          .insert({
            service_id: item.service_id,
            event_type: 'purchase',
            user_id: orderData.user_id,
            revenue_attributed: item.item_price * item.quantity,
            metadata: {
              order_id: orderData.id,
              order_item_id: item.id,
              stripe_session_id: session_id,
              vendor_id: item.vendor_id
            }
          });

        // Log vendor activity
        if (item.vendor_id) {
          await supabaseService
            .from('vendor_agent_activities')
            .insert({
              vendor_id: item.vendor_id,
              agent_id: orderData.user_id,
              activity_type: 'purchase',
              activity_data: {
                service_id: item.service_id,
                service_title: item.item_title,
                purchase_amount: item.item_price * item.quantity,
                order_id: orderData.id,
                commission_percentage: item.vendor_commission_percentage
              }
            });
        }
      }

      logStep("Purchase events logged successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderData.id,
        payment_status: session.payment_status,
        order_status: newStatus,
        items: orderData.order_items || [],
        total_amount: orderData.amount / 100, // Convert back from cents
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});