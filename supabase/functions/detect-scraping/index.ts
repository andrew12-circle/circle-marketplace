import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...data } = await req.json();

    switch (action) {
      case 'get_suspicious_activity':
        return await getSuspiciousActivity(supabase);
      
      case 'block_ip':
        return await blockIP(supabase, data);
      
      case 'unblock_ip':
        return await unblockIP(supabase, data);
      
      case 'update_settings':
        return await updateSettings(supabase, data);
      
      case 'log_request':
        return await logRequest(supabase, data, req);
      
      case 'check_ip_blocked':
        return await checkIPBlocked(supabase, data);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in detect-scraping function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getSuspiciousActivity(supabase: any) {
  try {
    // Get suspicious activity using the database function
    const { data, error } = await supabase.rpc('detect_suspicious_activity');
    
    if (error) throw error;

    return new Response(
      JSON.stringify({ suspicious_activity: data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Failed to get suspicious activity: ${error.message}`);
  }
}

async function blockIP(supabase: any, { ip_address, reason, permanent = false }: any) {
  try {
    // Insert blocked IP
    const { data, error } = await supabase
      .from('blocked_ips')
      .insert({
        ip_address,
        reason,
        is_permanent: permanent,
        expires_at: permanent ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Log security event
    await supabase
      .from('security_events')
      .insert({
        event_type: 'ip_blocked_manually',
        event_data: {
          ip_address,
          reason,
          is_permanent: permanent,
          blocked_by: 'admin'
        }
      });

    return new Response(
      JSON.stringify({ success: true, blocked_ip: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Failed to block IP: ${error.message}`);
  }
}

async function unblockIP(supabase: any, { ip_address }: any) {
  try {
    const { error } = await supabase
      .from('blocked_ips')
      .delete()
      .eq('ip_address', ip_address);

    if (error) throw error;

    // Log security event
    await supabase
      .from('security_events')
      .insert({
        event_type: 'ip_unblocked',
        event_data: {
          ip_address,
          unblocked_by: 'admin'
        }
      });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Failed to unblock IP: ${error.message}`);
  }
}

async function updateSettings(supabase: any, { enabled, rate_limit, time_window }: any) {
  try {
    const { error } = await supabase
      .from('scraping_settings')
      .update({
        enabled,
        rate_limit_per_minute: rate_limit,
        time_window_seconds: time_window,
        updated_at: new Date().toISOString()
      })
      .eq('id', (await supabase.from('scraping_settings').select('id').single()).data.id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Failed to update settings: ${error.message}`);
  }
}

async function logRequest(supabase: any, data: any, req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';

    // Log the request
    await supabase
      .from('request_logs')
      .insert({
        ip_address: ip,
        endpoint: data.endpoint || '/',
        method: data.method || 'GET',
        user_agent: userAgent,
        referer,
        request_size: data.request_size || 0,
        response_status: data.response_status || 200,
        response_time_ms: data.response_time_ms || 0,
        user_id: data.user_id || null
      });

    // Check if we need to auto-block based on recent activity
    const { data: settings } = await supabase
      .from('scraping_settings')
      .select('*')
      .single();

    if (settings?.enabled) {
      // Run auto-blocking check
      await supabase.rpc('auto_block_suspicious_ips');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Failed to log request:', error);
    // Don't throw error for logging failures to avoid blocking legitimate requests
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function checkIPBlocked(supabase: any, { ip_address }: any) {
  try {
    const { data, error } = await supabase
      .from('blocked_ips')
      .select('*')
      .eq('ip_address', ip_address)
      .or('is_permanent.eq.true,expires_at.gt.' + new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

    const isBlocked = !!data;

    return new Response(
      JSON.stringify({ 
        is_blocked: isBlocked,
        blocked_info: data || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Failed to check IP status: ${error.message}`);
  }
}