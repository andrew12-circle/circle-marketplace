import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FacilitatorStartRequest {
  serviceId: string;
  vendorId: string;
  totalServiceAmount: number;
  partnerType?: string;
  partnerEmail?: string;
  estimatedPartnerContribution?: number;
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

    const {
      serviceId,
      vendorId,
      totalServiceAmount,
      partnerType,
      partnerEmail,
      estimatedPartnerContribution = 0
    }: FacilitatorStartRequest = await req.json();

    console.log('Starting facilitator checkout for:', {
      serviceId,
      vendorId,
      totalServiceAmount,
      partnerType,
      estimatedPartnerContribution
    });

    // Check if facilitator checkout is enabled
    const { data: appConfig } = await supabaseClient
      .from('app_config')
      .select('facilitator_checkout_enabled')
      .single();

    if (!appConfig?.facilitator_checkout_enabled) {
      throw new Error("Facilitator checkout is not enabled");
    }

    // Get vendor configuration
    const { data: vendor } = await supabaseClient
      .from('vendors')
      .select('accepts_split_payments, requires_circle_payout, facilitator_fee_percentage')
      .eq('id', vendorId)
      .single();

    if (!vendor) throw new Error("Vendor not found");

    // Calculate amounts
    const partnerContributionAmount = estimatedPartnerContribution || 0;
    const agentAmount = totalServiceAmount - partnerContributionAmount;
    
    // Calculate facilitator fee (only if vendor requires Circle payout)
    const facilitatorFeeAmount = vendor.requires_circle_payout 
      ? (totalServiceAmount * (vendor.facilitator_fee_percentage || 3.0)) / 100
      : 0;

    // Generate order number
    const orderNumber = `CF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create copay order
    const { data: order, error: orderError } = await supabaseClient
      .from('copay_orders')
      .insert({
        agent_id: userData.user.id,
        vendor_id: vendorId,
        service_id: serviceId,
        order_number: orderNumber,
        agent_amount: agentAmount,
        partner_contribution_amount: partnerContributionAmount,
        facilitator_fee_amount: facilitatorFeeAmount,
        total_service_amount: totalServiceAmount,
        partner_type: partnerType,
        partner_email: partnerEmail,
        order_metadata: {
          vendor_accepts_split_payments: vendor.accepts_split_payments,
          vendor_requires_circle_payout: vendor.requires_circle_payout,
          facilitator_fee_percentage: vendor.facilitator_fee_percentage
        }
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create partner contribution record if partner details provided
    if (partnerEmail && partnerContributionAmount > 0) {
      const invitationToken = crypto.randomUUID();
      
      const { error: contributionError } = await supabaseClient
        .from('partner_contributions')
        .insert({
          copay_order_id: order.id,
          partner_type: partnerType || 'unknown',
          partner_email: partnerEmail,
          contribution_amount: partnerContributionAmount,
          invitation_token: invitationToken
        });

      if (contributionError) throw contributionError;
    }

    console.log('Facilitator order created:', order.order_number);

    return new Response(JSON.stringify({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        agentAmount: agentAmount,
        partnerContributionAmount: partnerContributionAmount,
        facilitatorFeeAmount: facilitatorFeeAmount,
        totalServiceAmount: totalServiceAmount,
        vendorRequiresCirclePayout: vendor.requires_circle_payout
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in copay-facilitator-start:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});