import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClickTrackingRequest {
  affiliate_code: string;
  destination_url: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
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
      affiliate_code,
      destination_url,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      referrer
    }: ClickTrackingRequest = await req.json();

    console.log(`[TRACK-CLICK] Processing click for affiliate code: ${affiliate_code}`);

    // Get client IP address
    const clientIP = req.headers.get('CF-Connecting-IP') || 
                    req.headers.get('X-Forwarded-For') || 
                    req.headers.get('X-Real-IP') || 
                    'unknown';

    const userAgent = req.headers.get('User-Agent') || 'unknown';

    // Find the affiliate link by code
    const { data: affiliateLink, error: linkError } = await supabase
      .from('affiliate_links')
      .select(`
        id,
        affiliate_id,
        destination_url,
        affiliates!inner(id, user_id, status)
      `)
      .eq('code', affiliate_code)
      .eq('status', 'active')
      .eq('affiliates.status', 'active')
      .single();

    if (linkError || !affiliateLink) {
      console.error(`[TRACK-CLICK] Affiliate link not found for code: ${affiliate_code}`, linkError);
      return new Response(
        JSON.stringify({ error: 'Affiliate link not found or inactive' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[TRACK-CLICK] Found affiliate link: ${affiliateLink.id}`);

    // Record the click
    const { data: clickRecord, error: clickError } = await supabase
      .from('affiliate_clicks')
      .insert({
        link_id: affiliateLink.id,
        affiliate_id: affiliateLink.affiliate_id,
        ip: clientIP,
        user_agent: userAgent,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        referrer,
        clicked_at: new Date().toISOString()
      })
      .select()
      .single();

    if (clickError) {
      console.error('[TRACK-CLICK] Error recording click:', clickError);
      return new Response(
        JSON.stringify({ error: 'Failed to record click' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[TRACK-CLICK] Click recorded with ID: ${clickRecord.id}`);

    // Create attribution record for 30-day tracking
    const { error: attributionError } = await supabase
      .from('affiliate_attributions')
      .insert({
        link_id: affiliateLink.id,
        affiliate_id: affiliateLink.affiliate_id,
        session_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        attribution_model: 'last_click',
        cookie_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      });

    if (attributionError) {
      console.error('[TRACK-CLICK] Error creating attribution:', attributionError);
    } else {
      console.log('[TRACK-CLICK] Attribution record created');
    }

    // Return the destination URL for redirect
    const finalDestinationUrl = destination_url || affiliateLink.destination_url;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        click_id: clickRecord.id,
        redirect_url: finalDestinationUrl
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[TRACK-CLICK] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});