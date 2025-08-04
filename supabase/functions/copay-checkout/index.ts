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

    const { cartItems, coPayDiscounts } = await req.json();

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Calculate amounts
    const subtotal = cartItems.reduce((sum: number, item: any) => {
      const price = parseFloat(item.pro_price?.replace(/[^0-9.]/g, '') || item.retail_price?.replace(/[^0-9.]/g, '') || '0');
      return sum + price;
    }, 0);

    const totalDiscounts = coPayDiscounts.reduce((sum: number, discount: any) => sum + discount.discountAmount, 0);
    const finalAmount = subtotal - totalDiscounts;

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: userData.user.email!, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create line items for Stripe
    const lineItems = cartItems.map((item: any) => {
      const basePrice = parseFloat(item.pro_price?.replace(/[^0-9.]/g, '') || item.retail_price?.replace(/[^0-9.]/g, '') || '0');
      const discount = coPayDiscounts.find((d: any) => d.serviceId === item.id);
      const finalPrice = discount ? basePrice - discount.discountAmount : basePrice;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title,
            description: discount ? `Original: $${basePrice.toFixed(2)} - Co-pay discount: $${discount.discountAmount.toFixed(2)}` : undefined,
          },
          unit_amount: Math.round(finalPrice * 100), // Convert to cents
        },
        quantity: 1,
      };
    });

    // Create checkout session with enhanced fraud monitoring
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userData.user.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        user_id: userData.user.id,
        copay_requests: JSON.stringify(coPayDiscounts.map((d: any) => d.requestId)),
        total_savings: totalDiscounts.toString(),
        fraud_monitoring: "enabled"
      },
      // Enable enhanced Radar monitoring for co-pay transactions
      payment_intent_data: {
        radar_options: {
          session: `copay_${userData.user.id}_${Date.now()}`
        }
      }
    });

    // Create payment records for co-pay requests
    for (const discount of coPayDiscounts) {
      const servicePrice = cartItems.find((item: any) => item.id === discount.serviceId);
      const servicePriceAmount = parseFloat(servicePrice?.pro_price?.replace(/[^0-9.]/g, '') || servicePrice?.retail_price?.replace(/[^0-9.]/g, '') || '0');
      
      await supabaseClient.from('copay_payments').insert({
        copay_request_id: discount.requestId,
        stripe_payment_intent_id: session.payment_intent,
        agent_amount: servicePriceAmount - discount.discountAmount,
        vendor_reimbursement: discount.discountAmount,
        total_service_amount: servicePriceAmount,
        payment_status: 'pending'
      });
    }

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error in copay-checkout:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});