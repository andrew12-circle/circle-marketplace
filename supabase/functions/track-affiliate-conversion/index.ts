import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversionTrackingRequest {
  user_email?: string;
  user_id?: string;
  conversion_type: 'subscription_signup' | 'subscription_upgrade' | 'marketplace_purchase' | 'custom';
  amount_gross: number;
  order_id?: string;
  subscription_id?: string;
  commission_rate?: number;
  commission_flat?: number;
  session_id?: string; // For attribution linking
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for secure operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const {
      user_email,
      user_id,
      conversion_type,
      amount_gross,
      order_id,
      subscription_id,
      commission_rate,
      commission_flat,
      session_id
    }: ConversionTrackingRequest = await req.json();

    console.log(`[TRACK-CONVERSION] Processing conversion: ${conversion_type} for ${user_email || user_id}`);

    // Find the most recent attribution within 30 days
    let attribution = null;
    
    if (session_id) {
      // Try to find attribution by session ID first
      const { data: sessionAttribution } = await supabase
        .from('affiliate_attributions')
        .select(`
          *,
          affiliates!inner(id, user_id, status)
        `)
        .eq('session_id', session_id)
        .eq('affiliates.status', 'active')
        .gte('cookie_expires_at', new Date().toISOString())
        .single();
      
      attribution = sessionAttribution;
    }

    if (!attribution && user_email) {
      // Fallback: try to find attribution by user email within 30 days
      const { data: emailAttribution } = await supabase
        .from('affiliate_attributions')
        .select(`
          *,
          affiliates!inner(id, user_id, status)
        `)
        .eq('prospect_user_id', user_id)
        .eq('affiliates.status', 'active')
        .gte('cookie_expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      attribution = emailAttribution;
    }

    if (!attribution) {
      console.log('[TRACK-CONVERSION] No valid attribution found within 30-day window');
      return new Response(
        JSON.stringify({ success: false, message: 'No attribution found' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[TRACK-CONVERSION] Found attribution for affiliate: ${attribution.affiliate_id}`);

    // Calculate commission based on conversion type and amount
    let calculatedCommissionRate = commission_rate;
    let calculatedCommissionFlat = commission_flat;

    if (!calculatedCommissionRate && !calculatedCommissionFlat) {
      // Default commission rates based on conversion type
      switch (conversion_type) {
        case 'subscription_signup':
        case 'subscription_upgrade':
          calculatedCommissionRate = 0.20; // 20% for Circle Pro subscriptions
          break;
        case 'marketplace_purchase':
          calculatedCommissionRate = 0.10; // 10% for marketplace purchases
          break;
        default:
          calculatedCommissionRate = 0.10; // 10% default
          break;
      }
    }

    // Calculate commission amount
    let commissionAmount = 0;
    if (calculatedCommissionFlat) {
      commissionAmount = calculatedCommissionFlat;
    } else if (calculatedCommissionRate) {
      commissionAmount = amount_gross * calculatedCommissionRate;
    }

    // Calculate eligible amount (what qualifies for commission)
    const eligibleAmount = amount_gross;

    // Record the conversion
    const { data: conversionRecord, error: conversionError } = await supabase
      .from('affiliate_conversions')
      .insert({
        affiliate_id: attribution.affiliate_id,
        link_id: attribution.link_id,
        conversion_type,
        amount_gross,
        eligible_amount,
        commission_rate: calculatedCommissionRate || 0,
        commission_flat: calculatedCommissionFlat || 0,
        commission_amount: commissionAmount,
        order_id,
        subscription_id,
        status: 'pending',
        event_timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (conversionError) {
      console.error('[TRACK-CONVERSION] Error recording conversion:', conversionError);
      return new Response(
        JSON.stringify({ error: 'Failed to record conversion' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[TRACK-CONVERSION] Conversion recorded with ID: ${conversionRecord.id}, Commission: $${commissionAmount}`);

    // Update attribution with the user if provided
    if (user_id && !attribution.prospect_user_id) {
      await supabase
        .from('affiliate_attributions')
        .update({ prospect_user_id: user_id })
        .eq('id', attribution.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        conversion_id: conversionRecord.id,
        commission_amount: commissionAmount,
        affiliate_id: attribution.affiliate_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[TRACK-CONVERSION] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});