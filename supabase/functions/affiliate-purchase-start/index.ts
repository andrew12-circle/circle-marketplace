import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const { service_id, coverage_type, vendor_id, affiliate_url } = await req.json();

    // Record the affiliate purchase start
    const { error: insertError } = await supabaseClient
      .from('affiliate_purchases')
      .insert({
        user_id: user.id,
        service_id,
        coverage_type,
        vendor_id,
        affiliate_url,
        status: 'redirected',
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error recording affiliate purchase:', insertError);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Affiliate purchase tracked' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Affiliate purchase tracking error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});