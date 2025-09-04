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

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const realmId = url.searchParams.get('realmId');
    const state = url.searchParams.get('state');
    
    if (!code || !realmId || !state) {
      return new Response('Missing required parameters', { status: 400, headers: corsHeaders });
    }

    // Verify state cookie (simplified - in production you'd get cookie from request)
    console.log('QBO callback received:', { code: !!code, realmId, state });

    const clientId = Deno.env.get('QBO_CLIENT_ID');
    const clientSecret = Deno.env.get('QBO_CLIENT_SECRET');
    const redirectUri = Deno.env.get('QBO_REDIRECT_URI');
    const oauthBase = Deno.env.get('QBO_OAUTH_BASE') || 'https://oauth.platform.intuit.com';

    if (!clientId || !clientSecret || !redirectUri) {
      return new Response('Configuration error', { status: 500, headers: corsHeaders });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(`${oauthBase}/oauth2/v1/tokens/bearer`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return new Response('Token exchange failed', { status: 400, headers: corsHeaders });
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens received:', { 
      access_token: !!tokens.access_token, 
      refresh_token: !!tokens.refresh_token,
      expires_in: tokens.expires_in 
    });

    // Calculate expires_at
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

    // Store tokens in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response('Supabase configuration error', { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For now, use a default org_id - in production this would come from user session
    const defaultOrgId = '00000000-0000-0000-0000-000000000000';

    const { error: dbError } = await supabase.rpc('update_qbo_tokens', {
      p_org_id: defaultOrgId,
      p_realm_id: realmId,
      p_access_token: tokens.access_token,
      p_refresh_token: tokens.refresh_token,
      p_expires_at: expiresAt.toISOString(),
    });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response('Failed to store tokens', { status: 500, headers: corsHeaders });
    }

    console.log('QBO connection successful for realm:', realmId);

    // Redirect back to admin settings with success message
    const adminUrl = url.origin + '/admin?qbo=connected';
    
    return new Response('', {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': adminUrl,
      }
    });

  } catch (error: any) {
    console.error('Error in qbo-callback:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process QBO callback' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);