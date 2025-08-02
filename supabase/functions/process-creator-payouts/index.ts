import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { payout_month, action } = await req.json();

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (action === "generate") {
      // Generate payout records for the month
      console.log(`Generating payout records for month: ${payout_month || 'current'}`);

      const targetMonth = payout_month || new Date().toISOString().slice(0, 7);
      
      // Run the calculate_monthly_payouts function
      const { error: calcError } = await supabase.rpc('calculate_monthly_payouts', {
        target_month: targetMonth
      });

      if (calcError) {
        throw new Error(`Failed to calculate payouts: ${calcError.message}`);
      }

      // Get the generated payouts
      const { data: generatedPayouts } = await supabase
        .from("creator_payouts")
        .select(`
          *,
          profiles!creator_id (
            display_name,
            business_name
          ),
          creator_payment_info!creator_id (
            payment_method,
            verified
          )
        `)
        .eq("payout_month", targetMonth);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Generated payout records for ${targetMonth}`,
          payouts: generatedPayouts,
          total_amount: generatedPayouts?.reduce((sum, p) => sum + (p.final_amount || 0), 0) || 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );

    } else if (action === "mark_paid") {
      // Mark specific payouts as paid
      const { payout_ids } = await req.json();
      
      if (!payout_ids || !Array.isArray(payout_ids)) {
        throw new Error("payout_ids array is required");
      }

      console.log(`Marking ${payout_ids.length} payouts as paid`);

      const { data: updatedPayouts, error: updateError } = await supabase
        .from("creator_payouts")
        .update({
          status: "completed",
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in("id", payout_ids)
        .select();

      if (updateError) {
        throw new Error(`Failed to update payouts: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Marked ${updatedPayouts?.length || 0} payouts as paid`,
          updated_payouts: updatedPayouts,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );

    } else {
      // Get pending payouts for review
      const targetMonth = payout_month || new Date().toISOString().slice(0, 7);
      
      const { data: pendingPayouts } = await supabase
        .from("creator_payouts")
        .select(`
          *,
          profiles!creator_id (
            display_name,
            business_name,
            creator_bio
          ),
          creator_payment_info!creator_id (
            payment_method,
            verified,
            paypal_email,
            bank_account_holder,
            bank_name
          )
        `)
        .eq("payout_month", targetMonth)
        .in("status", ["pending", "requires_setup"])
        .gte("final_amount", 25) // Minimum payout threshold
        .order("final_amount", { ascending: false });

      const totalAmount = pendingPayouts?.reduce((sum, p) => sum + (p.final_amount || 0), 0) || 0;

      return new Response(
        JSON.stringify({
          success: true,
          payouts: pendingPayouts || [],
          total_amount: totalAmount,
          count: pendingPayouts?.length || 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

  } catch (error) {
    console.error("Process payouts error:", error);
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