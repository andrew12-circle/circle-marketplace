import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-calendly-signature',
};

interface CalendlyWebhookPayload {
  event: string;
  time: string;
  payload: {
    event_type: string;
    name: string;
    uri: string;
    status: string;
    start_time: string;
    end_time: string;
    invitee: {
      name: string;
      email: string;
      uri: string;
    };
    questions_and_answers?: Array<{
      question: string;
      answer: string;
    }>;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.text();
    const webhookData: CalendlyWebhookPayload = JSON.parse(body);

    console.log('Received Calendly webhook:', webhookData);

    // Verify webhook signature if signing key is available
    const signingKey = Deno.env.get('CALENDLY_SIGNING_KEY');
    if (signingKey) {
      const signature = req.headers.get('x-calendly-signature');
      if (!signature) {
        return new Response('Missing signature', { status: 401, headers: corsHeaders });
      }
      
      // Verify signature (simplified - in production you'd want more robust verification)
      const expectedSignature = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(signingKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      ).then(key => 
        crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
      ).then(signature => 
        Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      );

      if (signature !== expectedSignature) {
        return new Response('Invalid signature', { status: 401, headers: corsHeaders });
      }
    }

    // Store webhook event
    const { error: webhookError } = await supabase
      .from('webhook_events')
      .insert({
        provider: 'calendly',
        event_type: webhookData.event,
        external_event_id: webhookData.payload.uri,
        payload: webhookData,
        processed: false
      });

    if (webhookError) {
      console.error('Error storing webhook event:', webhookError);
    }

    // Process the webhook based on event type
    if (webhookData.event === 'invitee.created') {
      await processCalendlyBooking(supabase, webhookData);
    } else if (webhookData.event === 'invitee.canceled') {
      await processCalendlyCancel(supabase, webhookData);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error processing Calendly webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

async function processCalendlyBooking(supabase: any, webhookData: CalendlyWebhookPayload) {
  try {
    // Try to find existing lead capture record by email
    const { data: existingBooking } = await supabase
      .from('consultation_bookings')
      .select('*')
      .eq('client_email', webhookData.payload.invitee.email)
      .eq('is_external', true)
      .eq('status', 'lead_captured')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingBooking) {
      // Update existing record
      const { error } = await supabase
        .from('consultation_bookings')
        .update({
          status: 'confirmed',
          external_event_id: webhookData.payload.uri,
          external_status: webhookData.payload.status,
          scheduled_at: webhookData.payload.start_time,
          scheduled_date: new Date(webhookData.payload.start_time).toISOString().split('T')[0],
          scheduled_time: new Date(webhookData.payload.start_time).toISOString().split('T')[1].slice(0, 5)
        })
        .eq('id', existingBooking.id);

      if (error) {
        console.error('Error updating booking:', error);
      } else {
        console.log('Updated existing booking:', existingBooking.id);
      }
    } else {
      // Create new booking record
      const { error } = await supabase
        .from('consultation_bookings')
        .insert({
          client_name: webhookData.payload.invitee.name,
          client_email: webhookData.payload.invitee.email,
          scheduled_date: new Date(webhookData.payload.start_time).toISOString().split('T')[0],
          scheduled_time: new Date(webhookData.payload.start_time).toISOString().split('T')[1].slice(0, 5),
          status: 'confirmed',
          is_external: true,
          external_provider: 'calendly',
          external_event_id: webhookData.payload.uri,
          external_status: webhookData.payload.status,
          scheduled_at: webhookData.payload.start_time,
          source: 'calendly_webhook',
          project_details: webhookData.payload.questions_and_answers?.find(qa => 
            qa.question.toLowerCase().includes('project') || qa.question.toLowerCase().includes('details')
          )?.answer || null
        });

      if (error) {
        console.error('Error creating booking:', error);
      } else {
        console.log('Created new booking from Calendly');
      }
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date() })
      .eq('external_event_id', webhookData.payload.uri)
      .eq('processed', false);

  } catch (error) {
    console.error('Error processing Calendly booking:', error);
  }
}

async function processCalendlyCancel(supabase: any, webhookData: CalendlyWebhookPayload) {
  try {
    const { error } = await supabase
      .from('consultation_bookings')
      .update({
        status: 'cancelled',
        external_status: 'canceled'
      })
      .eq('external_event_id', webhookData.payload.uri);

    if (error) {
      console.error('Error canceling booking:', error);
    } else {
      console.log('Canceled booking:', webhookData.payload.uri);
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date() })
      .eq('external_event_id', webhookData.payload.uri)
      .eq('processed', false);

  } catch (error) {
    console.error('Error processing Calendly cancellation:', error);
  }
}