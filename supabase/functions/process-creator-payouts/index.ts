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
    const { payout_month, action } = await req.json();

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (action === "auto_process") {
      // Automated monthly payout processing - like Apple Music
      console.log(`Auto-processing payouts for month: ${payout_month || 'current'}`);

      const targetMonth = payout_month || new Date().toISOString().slice(0, 7);
      
      // First, generate the monthly calculations
      const { error: calcError } = await supabase.rpc('calculate_monthly_payouts', {
        target_month: targetMonth
      });

      if (calcError) {
        throw new Error(`Failed to calculate payouts: ${calcError.message}`);
      }

      // Get verified creators with valid Stripe accounts
      const { data: eligiblePayouts } = await supabase
        .from("creator_payouts")
        .select(`
          *,
          creator_payment_info!creator_id (
            stripe_account_id,
            verified,
            payment_method,
            tax_form_completed,
            minimum_payout_amount
          ),
          profiles!creator_id (
            display_name,
            business_name,
            creator_verified
          )
        `)
        .eq("payout_month", targetMonth)
        .eq("status", "pending");

      if (!eligiblePayouts || eligiblePayouts.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "No eligible payouts found",
            processed: 0,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      let processed = 0;
      let failed = 0;
      let skipped = 0;
      const results = [];

      for (const payout of eligiblePayouts) {
        try {
          const paymentInfo = payout.creator_payment_info;
          const profile = payout.profiles;
          
          // Check creator verification requirements
          if (!profile?.creator_verified) {
            console.log(`Skipping payout ${payout.id}: creator not verified`);
            await supabase
              .from("creator_payouts")
              .update({
                status: "requires_verification",
                error_message: "Creator verification required",
                updated_at: new Date().toISOString(),
              })
              .eq("id", payout.id);
            skipped++;
            continue;
          }

          // Check Stripe account requirements
          if (!paymentInfo?.stripe_account_id || !paymentInfo?.verified) {
            console.log(`Skipping payout ${payout.id}: Stripe account not verified`);
            await supabase
              .from("creator_payouts")
              .update({
                status: "requires_setup",
                error_message: "Stripe account setup required",
                updated_at: new Date().toISOString(),
              })
              .eq("id", payout.id);
            skipped++;
            continue;
          }

          // Check tax form completion
          if (!paymentInfo?.tax_form_completed) {
            console.log(`Skipping payout ${payout.id}: tax form not completed`);
            await supabase
              .from("creator_payouts")
              .update({
                status: "requires_tax_info",
                error_message: "Tax information required",
                updated_at: new Date().toISOString(),
              })
              .eq("id", payout.id);
            skipped++;
            continue;
          }

          // Check minimum payout threshold
          const minAmount = paymentInfo?.minimum_payout_amount || 25;
          if (payout.final_amount < minAmount) {
            console.log(`Skipping payout ${payout.id}: below minimum threshold ($${minAmount})`);
            // Keep as pending for next month accumulation
            skipped++;
            continue;
          }

          // Verify Stripe account is still active
          const account = await stripe.accounts.retrieve(paymentInfo.stripe_account_id);
          if (!account.payouts_enabled) {
            console.log(`Skipping payout ${payout.id}: Stripe account payouts disabled`);
            await supabase
              .from("creator_payouts")
              .update({
                status: "account_issue",
                error_message: "Stripe account payouts disabled",
                updated_at: new Date().toISOString(),
              })
              .eq("id", payout.id);
            skipped++;
            continue;
          }

          // Create Stripe transfer
          const transfer = await stripe.transfers.create({
            amount: Math.round(payout.final_amount * 100), // Convert to cents
            currency: "usd",
            destination: paymentInfo.stripe_account_id,
            description: `Creator earnings for ${payout.payout_month}`,
            metadata: {
              creator_id: payout.creator_id,
              payout_id: payout.id,
              payout_month: payout.payout_month,
              creator_name: profile?.display_name || profile?.business_name || "Unknown",
            },
          });

          console.log(`Transfer created: ${transfer.id} for $${payout.final_amount} to ${profile?.display_name}`);

          // Update payout record
          await supabase
            .from("creator_payouts")
            .update({
              status: "completed",
              payment_processor_id: transfer.id,
              payment_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", payout.id);

          results.push({
            creator_name: profile?.display_name || profile?.business_name,
            amount: payout.final_amount,
            transfer_id: transfer.id,
          });

          processed++;

        } catch (error) {
          console.error(`Failed to process payout ${payout.id}:`, error);
          
          // Update payout with error
          await supabase
            .from("creator_payouts")
            .update({
              status: "failed",
              error_message: error.message,
              retry_count: (payout.retry_count || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", payout.id);

          failed++;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Auto-processed payouts: ${processed} completed, ${failed} failed, ${skipped} skipped`,
          processed,
          failed,
          skipped,
          total: eligiblePayouts.length,
          results,
          total_paid: results.reduce((sum, r) => sum + r.amount, 0),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );

    } else {
      // Get payout summary for admin review
      const targetMonth = payout_month || new Date().toISOString().slice(0, 7);
      
      const { data: payoutSummary } = await supabase
        .from("creator_payouts")
        .select(`
          *,
          profiles!creator_id (
            display_name,
            business_name,
            creator_verified
          ),
          creator_payment_info!creator_id (
            stripe_account_id,
            verified,
            tax_form_completed,
            minimum_payout_amount
          )
        `)
        .eq("payout_month", targetMonth)
        .order("final_amount", { ascending: false });

      const summary = {
        total_payouts: payoutSummary?.length || 0,
        ready_to_pay: payoutSummary?.filter(p => 
          p.status === "pending" && 
          p.profiles?.creator_verified && 
          p.creator_payment_info?.verified &&
          p.creator_payment_info?.tax_form_completed &&
          p.final_amount >= (p.creator_payment_info?.minimum_payout_amount || 25)
        ).length || 0,
        needs_verification: payoutSummary?.filter(p => !p.profiles?.creator_verified).length || 0,
        needs_setup: payoutSummary?.filter(p => !p.creator_payment_info?.verified).length || 0,
        needs_tax_info: payoutSummary?.filter(p => !p.creator_payment_info?.tax_form_completed).length || 0,
        below_minimum: payoutSummary?.filter(p => p.final_amount < (p.creator_payment_info?.minimum_payout_amount || 25)).length || 0,
        total_amount: payoutSummary?.reduce((sum, p) => sum + (p.final_amount || 0), 0) || 0,
      };

      return new Response(
        JSON.stringify({
          success: true,
          summary,
          payouts: payoutSummary || [],
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
