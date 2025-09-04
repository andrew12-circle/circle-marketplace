import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { refresh_token, org_id, realm_id } = await req.json();

    if (!refresh_token || !org_id || !realm_id) {
      return new Response('Missing required fields', { status: 400, headers: corsHeaders });
    }

    const clientId = Deno.env.get('QBO_CLIENT_ID');
    const clientSecret = Deno.env.get('QBO_CLIENT_SECRET');
    const oauthBase = Deno.env.get('QBO_OAUTH_BASE') || 'https://oauth.platform.intuit.com';

    if (!clientId || !clientSecret) {
      return new Response('Configuration error', { status: 500, headers: corsHeaders });
    }

    // Refresh the token
    const tokenResponse = await fetch(`${oauthBase}/oauth2/v1/tokens/bearer`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token refresh failed:', errorText);
      return new Response('Token refresh failed', { status: 400, headers: corsHeaders });
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens refreshed:', { 
      access_token: !!tokens.access_token, 
      refresh_token: !!tokens.refresh_token,
      expires_in: tokens.expires_in 
    });

    // Calculate new expires_at
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

    // Update tokens in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response('Supabase configuration error', { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase.rpc('update_qbo_tokens', {
      p_org_id: org_id,
      p_realm_id: realm_id,
      p_access_token: tokens.access_token,
      p_refresh_token: tokens.refresh_token,
      p_expires_at: expiresAt.toISOString(),
    });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response('Failed to update tokens', { status: 500, headers: corsHeaders });
    }

    console.log('QBO tokens refreshed successfully');

    return new Response(
      JSON.stringify({ 
        access_token: tokens.access_token,
        expires_at: expiresAt.toISOString() 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in qbo-refresh-token:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to refresh token' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);