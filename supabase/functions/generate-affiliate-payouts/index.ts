import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayoutGenerationRequest {
  period_start: string; // ISO date string
  period_end: string;   // ISO date string
  minimum_payout?: number; // Default $50
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for secure operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userData.user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      period_start,
      period_end,
      minimum_payout = 50
    }: PayoutGenerationRequest = await req.json();

    console.log(`[GENERATE-PAYOUTS] Processing payouts for period: ${period_start} to ${period_end}`);

    // Get all approved conversions for the period that haven't been paid yet
    const { data: conversions, error: conversionsError } = await supabase
      .from('affiliate_conversions')
      .select(`
        *,
        affiliates!inner(
          id,
          user_id,
          legal_name,
          email,
          payout_method,
          tax_status,
          status
        )
      `)
      .eq('status', 'approved')
      .gte('approval_timestamp', period_start)
      .lte('approval_timestamp', period_end)
      .eq('affiliates.status', 'active');

    if (conversionsError) {
      console.error('[GENERATE-PAYOUTS] Error fetching conversions:', conversionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch conversions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[GENERATE-PAYOUTS] Found ${conversions?.length || 0} approved conversions`);

    // Group conversions by affiliate
    const affiliateCommissions = new Map();
    
    conversions?.forEach(conversion => {
      const affiliateId = conversion.affiliate_id;
      if (!affiliateCommissions.has(affiliateId)) {
        affiliateCommissions.set(affiliateId, {
          affiliate: conversion.affiliates,
          total_commission: 0,
          conversion_count: 0,
          conversions: []
        });
      }
      
      const affiliate = affiliateCommissions.get(affiliateId);
      affiliate.total_commission += conversion.commission_amount;
      affiliate.conversion_count += 1;
      affiliate.conversions.push(conversion);
    });

    // Generate payouts for affiliates meeting minimum threshold
    const payouts = [];
    const generatedPayouts = [];

    for (const [affiliateId, data] of affiliateCommissions) {
      if (data.total_commission >= minimum_payout) {
        const payout = {
          affiliate_id: affiliateId,
          period_start,
          period_end,
          total_commission: data.total_commission,
          adjustments: 0, // No adjustments for now
          payout_fee: 0, // Calculate fee based on payout method
          payout_amount: data.total_commission, // After adjustments and fees
          payout_method: data.affiliate.payout_method || 'ach',
          payout_status: 'pending',
          payout_reference: null
        };

        // Calculate payout fee based on method
        if (payout.payout_method === 'stripe_connect') {
          // Stripe Connect typically charges ~2.9% + $0.30
          payout.payout_fee = Math.max(0.30, data.total_commission * 0.029);
        } else if (payout.payout_method === 'ach') {
          // ACH is usually flat fee or very low percentage
          payout.payout_fee = 0; // Free for manual ACH processing
        }

        payout.payout_amount = data.total_commission - payout.payout_fee;
        payouts.push(payout);
      } else {
        console.log(`[GENERATE-PAYOUTS] Affiliate ${affiliateId} below minimum: $${data.total_commission}`);
      }
    }

    console.log(`[GENERATE-PAYOUTS] Generating ${payouts.length} payouts`);

    // Insert payouts into database
    if (payouts.length > 0) {
      const { data: insertedPayouts, error: payoutError } = await supabase
        .from('affiliate_payouts')
        .insert(payouts)
        .select();

      if (payoutError) {
        console.error('[GENERATE-PAYOUTS] Error inserting payouts:', payoutError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate payouts' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      generatedPayouts.push(...(insertedPayouts || []));
    }

    const summary = {
      period_start,
      period_end,
      total_affiliates_eligible: affiliateCommissions.size,
      total_affiliates_paid: payouts.length,
      total_commission_amount: Array.from(affiliateCommissions.values())
        .reduce((sum, data) => sum + data.total_commission, 0),
      total_payout_amount: payouts.reduce((sum, payout) => sum + payout.payout_amount, 0),
      total_fees: payouts.reduce((sum, payout) => sum + payout.payout_fee, 0),
      payouts_generated: generatedPayouts.length
    };

    console.log('[GENERATE-PAYOUTS] Generation complete:', summary);

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary,
        payouts: generatedPayouts
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[GENERATE-PAYOUTS] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});