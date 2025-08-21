import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PartnerCheckoutRequest {
  invitationToken: string;
  partnerContactInfo?: {
    name?: string;
    company?: string;
    phone?: string;
  };
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

    const { invitationToken, partnerContactInfo }: PartnerCheckoutRequest = await req.json();

    console.log('Processing partner checkout for token:', invitationToken);

    // Get the partner contribution
    const { data: contribution, error: contributionError } = await supabaseClient
      .from('partner_contributions')
      .select(`
        *,
        copay_orders!inner(
          *,
          services!inner(title),
          vendors!inner(name)
        )
      `)
      .eq('invitation_token', invitationToken)
      .single();

    if (contributionError || !contribution) {
      throw new Error("Invalid invitation token or contribution not found");
    }

    // Check if invitation has expired
    if (new Date(contribution.expires_at) < new Date()) {
      throw new Error("Invitation has expired");
    }

    // Check if already paid
    if (contribution.payment_status === 'completed') {
      throw new Error("Contribution has already been paid");
    }

    const order = contribution.copay_orders;

    // Update contribution with acceptance and contact info
    await supabaseClient
      .from('partner_contributions')
      .update({
        invitation_accepted_at: new Date().toISOString(),
        metadata: { 
          ...contribution.metadata, 
          contact_info: partnerContactInfo 
        }
      })
      .eq('id', contribution.id);

    // Update order with partner contact info
    if (partnerContactInfo) {
      await supabaseClient
        .from('copay_orders')
        .update({
          partner_contact_info: partnerContactInfo
        })
        .eq('id', order.id);
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create checkout session for partner
    const session = await stripe.checkout.sessions.create({
      customer_email: contribution.partner_email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${order.services.title} - Partner Contribution`,
              description: `Co-marketing contribution for service from ${order.vendors.name}`,
            },
            unit_amount: Math.round(contribution.contribution_amount * 100),
          },
          quantity: 1,
        }
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/partner-payment-success?session_id={CHECKOUT_SESSION_ID}&token=${invitationToken}`,
      cancel_url: `${req.headers.get("origin")}/partner-payment-canceled?token=${invitationToken}`,
      metadata: {
        contribution_id: contribution.id,
        copay_order_id: order.id,
        payment_type: 'partner_contribution',
        invitation_token: invitationToken
      },
    });

    // Update contribution with Stripe session info
    await supabaseClient
      .from('partner_contributions')
      .update({ 
        stripe_payment_intent_id: session.payment_intent,
        payment_status: 'pending'
      })
      .eq('id', contribution.id);

    console.log('Partner checkout session created:', session.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      contributionAmount: contribution.contribution_amount,
      partnerType: contribution.partner_type,
      serviceName: order.services.title,
      vendorName: order.vendors.name,
      success: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in copay-partner-checkout:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});