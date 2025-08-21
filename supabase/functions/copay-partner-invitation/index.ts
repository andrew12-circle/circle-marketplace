import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PartnerInvitationRequest {
  orderId: string;
  partnerEmail: string;
  partnerType: string;
  contributionAmount: number;
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
      orderId, 
      partnerEmail, 
      partnerType, 
      contributionAmount 
    }: PartnerInvitationRequest = await req.json();

    console.log('Creating partner invitation for order:', orderId);

    // Verify the order belongs to the user
    const { data: order, error: orderError } = await supabaseClient
      .from('copay_orders')
      .select(`
        *,
        services!inner(title),
        vendors!inner(name)
      `)
      .eq('id', orderId)
      .eq('agent_id', userData.user.id)
      .single();

    if (orderError || !order) throw new Error("Order not found or access denied");

    // Generate invitation token
    const invitationToken = crypto.randomUUID();

    // Create or update partner contribution
    const { data: contribution, error: contributionError } = await supabaseClient
      .from('partner_contributions')
      .upsert({
        copay_order_id: orderId,
        partner_type: partnerType,
        partner_email: partnerEmail,
        contribution_amount: contributionAmount,
        invitation_token: invitationToken,
        invitation_sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours
      }, {
        onConflict: 'copay_order_id,partner_email'
      })
      .select()
      .single();

    if (contributionError) throw contributionError;

    // Update order with partner details
    await supabaseClient
      .from('copay_orders')
      .update({
        partner_email: partnerEmail,
        partner_type: partnerType,
        partner_contribution_amount: contributionAmount,
        // Recalculate agent amount
        agent_amount: order.total_service_amount - contributionAmount
      })
      .eq('id', orderId);

    // In a real implementation, you would send an email here
    // For now, we'll just log the invitation details
    console.log('Partner invitation created:', {
      token: invitationToken,
      partnerEmail,
      contributionAmount,
      orderNumber: order.order_number
    });

    // TODO: Send email invitation using Resend or similar service
    // const invitationUrl = `${req.headers.get("origin")}/partner-contribution?token=${invitationToken}`;

    return new Response(JSON.stringify({
      success: true,
      invitationToken,
      contributionId: contribution.id,
      message: "Partner invitation created successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in copay-partner-invitation:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});