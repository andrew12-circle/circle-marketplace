import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentRequest {
  sessionId: string;
  type: 'agent' | 'partner';
  orderId?: string;
  contributionId?: string;
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

    const { sessionId, type, orderId, contributionId }: VerifyPaymentRequest = await req.json();

    console.log('Verifying payment:', { sessionId, type, orderId, contributionId });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      throw new Error("Session not found");
    }

    const isPaymentSuccessful = session.payment_status === 'paid';
    console.log('Payment status:', session.payment_status);

    if (type === 'agent' && orderId && isPaymentSuccessful) {
      // Update copay order status
      await supabaseClient
        .from('copay_orders')
        .update({ 
          agent_payment_status: 'completed',
          agent_paid_at: new Date().toISOString()
        })
        .eq('id', orderId);

      console.log('Updated agent payment status for order:', orderId);
    }

    if (type === 'partner' && contributionId && isPaymentSuccessful) {
      // Update partner contribution status
      await supabaseClient
        .from('partner_contributions')
        .update({ 
          payment_status: 'completed',
          paid_at: new Date().toISOString()
        })
        .eq('id', contributionId);

      console.log('Updated partner payment status for contribution:', contributionId);
    }

    return new Response(JSON.stringify({ 
      success: true,
      paymentStatus: session.payment_status,
      isPaymentSuccessful,
      sessionDetails: {
        id: session.id,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total,
        currency: session.currency
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in copay-verify-payment:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});