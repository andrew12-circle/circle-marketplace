import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentCheckoutRequest {
  orderId: string;
  acknowledgedPrimaryPayer: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    if (!userData.user) throw new Error("User not authenticated");

    const { orderId, acknowledgedPrimaryPayer }: AgentCheckoutRequest = await req.json();

    if (!acknowledgedPrimaryPayer) {
      throw new Error("Agent must acknowledge they are the primary payer");
    }

    console.log('Processing agent checkout for order:', orderId);

    // Get the order
    const { data: order, error: orderError } = await supabaseClient
      .from('copay_orders')
      .select(`
        *,
        services!inner(title, pro_price, retail_price),
        vendors!inner(name)
      `)
      .eq('id', orderId)
      .eq('agent_id', userData.user.id)
      .single();

    if (orderError || !order) throw new Error("Order not found or access denied");

    // Update order with acknowledgment
    await supabaseClient
      .from('copay_orders')
      .update({ agent_acknowledged_primary_payer: true })
      .eq('id', orderId);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: userData.user.email!, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Calculate total amount (agent amount + facilitator fee)
    const totalAmount = order.agent_amount + order.facilitator_fee_amount;

    // Create line items
    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${order.services.title} - Agent Portion`,
            description: `Service from ${order.vendors.name}`,
          },
          unit_amount: Math.round(order.agent_amount * 100),
        },
        quantity: 1,
      }
    ];

    // Add facilitator fee if applicable
    if (order.facilitator_fee_amount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Payment Facilitation Fee",
            description: "Circle Network payment processing fee",
          },
          unit_amount: Math.round(order.facilitator_fee_amount * 100),
        },
        quantity: 1,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userData.user.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled?order_id=${orderId}`,
      metadata: {
        copay_order_id: orderId,
        payment_type: 'agent_payment',
        order_number: order.order_number
      },
    });

    // Update order with Stripe session info
    await supabaseClient
      .from('copay_orders')
      .update({ 
        agent_stripe_payment_intent_id: session.payment_intent,
        agent_payment_status: 'pending'
      })
      .eq('id', orderId);

    console.log('Agent checkout session created:', session.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      success: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in copay-agent-checkout:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});