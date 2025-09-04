import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const clientId = Deno.env.get('QBO_CLIENT_ID');
    const redirectUri = Deno.env.get('QBO_REDIRECT_URI');
    const oauthBase = Deno.env.get('QBO_OAUTH_BASE') || 'https://oauth.platform.intuit.com';
    
    if (!clientId || !redirectUri) {
      console.error('Missing QBO environment variables:', { clientId: !!clientId, redirectUri: !!redirectUri });
      return new Response('Configuration error', { status: 500, headers: corsHeaders });
    }

    // Generate random state value for CSRF protection
    const state = crypto.randomUUID();
    
    // Build authorization URL
    const authUrl = new URL(`${oauthBase}/v1/openid_connect/oauth2`);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('scope', 'com.intuit.quickbooks.accounting');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('state', state);

    console.log('QBO OAuth redirect:', { authUrl: authUrl.toString(), state });

    // Set state cookie and redirect
    const response = new Response('', {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': authUrl.toString(),
        'Set-Cookie': `qbo_oauth_state=${state}; HttpOnly; SameSite=Lax; Max-Age=600; Path=/`,
      }
    });

    return response;

  } catch (error: any) {
    console.error('Error in qbo-connect:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to initiate QBO connection' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);