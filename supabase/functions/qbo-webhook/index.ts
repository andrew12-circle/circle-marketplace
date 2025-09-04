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

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('intuit-signature');
    
    if (!signature) {
      console.error('Missing Intuit signature header');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const clientSecret = Deno.env.get('QBO_CLIENT_SECRET');
    if (!clientSecret) {
      console.error('Missing QBO_CLIENT_SECRET');
      return new Response('Configuration error', { status: 500, headers: corsHeaders });
    }

    // Verify HMAC signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(clientSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    if (signature !== expectedSignature) {
      console.error('Invalid signature:', { received: signature, expected: expectedSignature });
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }

    // Parse webhook payload
    const payload = JSON.parse(rawBody);
    console.log('QBO Webhook received:', {
      timestamp: new Date().toISOString(),
      eventNotifications: payload.eventNotifications?.length || 0,
    });

    // Log webhook events for now - extend later for actual processing
    if (payload.eventNotifications) {
      for (const event of payload.eventNotifications) {
        console.log('QBO Event:', {
          realmId: event.realmId,
          name: event.name,
          id: event.id,
          operation: event.operation,
          lastUpdated: event.lastUpdated,
        });
      }
    }

    return new Response('OK', { 
      status: 200, 
      headers: { 'Content-Type': 'text/plain', ...corsHeaders } 
    });

  } catch (error: any) {
    console.error('Error in qbo-webhook:', error);
    return new Response('Internal error', { status: 500, headers: corsHeaders });
  }
};

serve(handler);