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
    const { org_id, customer_ref, amount, description } = await req.json();

    if (!org_id || !customer_ref || !amount || !description) {
      return new Response('Missing required fields', { status: 400, headers: corsHeaders });
    }

    // Get connection from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response('Supabase configuration error', { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: connection, error: dbError } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('org_id', org_id)
      .single();

    if (dbError || !connection) {
      console.error('No QBO connection found:', dbError);
      return new Response('No QuickBooks connection found', { status: 404, headers: corsHeaders });
    }

    // Check if token needs refresh
    const expiresAt = new Date(connection.expires_at);
    const now = new Date();
    const twoMinutes = 2 * 60 * 1000;

    let accessToken = connection.access_token;

    if (expiresAt.getTime() - now.getTime() < twoMinutes) {
      console.log('Token needs refresh for invoice creation');
      
      // Refresh token logic (similar to qbo-refresh-token function)
      const clientId = Deno.env.get('QBO_CLIENT_ID');
      const clientSecret = Deno.env.get('QBO_CLIENT_SECRET');
      const oauthBase = Deno.env.get('QBO_OAUTH_BASE') || 'https://oauth.platform.intuit.com';

      if (!clientId || !clientSecret) {
        return new Response('OAuth configuration error', { status: 500, headers: corsHeaders });
      }

      const tokenResponse = await fetch(`${oauthBase}/oauth2/v1/tokens/bearer`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token,
        }),
      });

      if (tokenResponse.ok) {
        const tokens = await tokenResponse.json();
        accessToken = tokens.access_token;
        
        // Update database with new tokens
        const newExpiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
        await supabase.rpc('update_qbo_tokens', {
          p_org_id: org_id,
          p_realm_id: connection.realm_id,
          p_access_token: tokens.access_token,
          p_refresh_token: tokens.refresh_token,
          p_expires_at: newExpiresAt.toISOString(),
        });
      }
    }

    // Create invoice
    const apiBase = Deno.env.get('QBO_API_BASE') || 'https://sandbox-quickbooks.api.intuit.com';
    
    const invoice = {
      Line: [
        {
          Amount: amount,
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: {
              value: '1', // Default service item
              name: 'Services'
            }
          }
        }
      ],
      CustomerRef: {
        value: customer_ref
      }
    };

    const response = await fetch(
      `${apiBase}/v3/company/${connection.realm_id}/invoice?minorversion=70`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(invoice),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('QBO invoice creation error:', errorText);
      return new Response(
        JSON.stringify({ error: `Failed to create invoice: ${response.status}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const result = await response.json();
    console.log('Invoice created successfully:', result.QueryResponse?.Invoice?.[0]?.Id);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in qbo-test-invoice:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create test invoice' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);