import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GHLWebhookPayload {
  type: string;
  appointmentId: string;
  eventType: string;
  appointment: {
    id: string;
    contactId: string;
    calendarId: string;
    title: string;
    startTime: string;
    endTime: string;
    status: string;
    contact: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
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

    const webhookData: GHLWebhookPayload = await req.json();

    console.log('Received GHL webhook:', webhookData);

    // Store webhook event
    const { error: webhookError } = await supabase
      .from('webhook_events')
      .insert({
        provider: 'gohighlevel',
        event_type: webhookData.eventType,
        external_event_id: webhookData.appointmentId,
        payload: webhookData,
        processed: false
      });

    if (webhookError) {
      console.error('Error storing webhook event:', webhookError);
    }

    // Process the webhook based on event type
    if (webhookData.eventType === 'appointment.created' || webhookData.eventType === 'appointment.booked') {
      await processGHLBooking(supabase, webhookData);
    } else if (webhookData.eventType === 'appointment.cancelled') {
      await processGHLCancel(supabase, webhookData);
    } else if (webhookData.eventType === 'appointment.updated') {
      await processGHLUpdate(supabase, webhookData);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error processing GHL webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

async function processGHLBooking(supabase: any, webhookData: GHLWebhookPayload) {
  try {
    const appointment = webhookData.appointment;
    const contact = appointment.contact;

    // Try to find existing lead capture record by email
    const { data: existingBooking } = await supabase
      .from('consultation_bookings')
      .select('*')
      .eq('client_email', contact.email)
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
          external_event_id: appointment.id,
          external_status: appointment.status,
          scheduled_at: appointment.startTime,
          scheduled_date: new Date(appointment.startTime).toISOString().split('T')[0],
          scheduled_time: new Date(appointment.startTime).toISOString().split('T')[1].slice(0, 5),
          client_phone: contact.phone || existingBooking.client_phone
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
          client_name: `${contact.firstName} ${contact.lastName}`.trim(),
          client_email: contact.email,
          client_phone: contact.phone || null,
          scheduled_date: new Date(appointment.startTime).toISOString().split('T')[0],
          scheduled_time: new Date(appointment.startTime).toISOString().split('T')[1].slice(0, 5),
          status: 'confirmed',
          is_external: true,
          external_provider: 'gohighlevel',
          external_event_id: appointment.id,
          external_status: appointment.status,
          scheduled_at: appointment.startTime,
          source: 'ghl_webhook'
        });

      if (error) {
        console.error('Error creating booking:', error);
      } else {
        console.log('Created new booking from GHL');
      }
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date() })
      .eq('external_event_id', appointment.id)
      .eq('processed', false);

  } catch (error) {
    console.error('Error processing GHL booking:', error);
  }
}

async function processGHLCancel(supabase: any, webhookData: GHLWebhookPayload) {
  try {
    const { error } = await supabase
      .from('consultation_bookings')
      .update({
        status: 'cancelled',
        external_status: 'cancelled'
      })
      .eq('external_event_id', webhookData.appointmentId);

    if (error) {
      console.error('Error canceling booking:', error);
    } else {
      console.log('Canceled booking:', webhookData.appointmentId);
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date() })
      .eq('external_event_id', webhookData.appointmentId)
      .eq('processed', false);

  } catch (error) {
    console.error('Error processing GHL cancellation:', error);
  }
}

async function processGHLUpdate(supabase: any, webhookData: GHLWebhookPayload) {
  try {
    const appointment = webhookData.appointment;

    const { error } = await supabase
      .from('consultation_bookings')
      .update({
        external_status: appointment.status,
        scheduled_at: appointment.startTime,
        scheduled_date: new Date(appointment.startTime).toISOString().split('T')[0],
        scheduled_time: new Date(appointment.startTime).toISOString().split('T')[1].slice(0, 5)
      })
      .eq('external_event_id', appointment.id);

    if (error) {
      console.error('Error updating booking:', error);
    } else {
      console.log('Updated booking:', appointment.id);
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date() })
      .eq('external_event_id', appointment.id)
      .eq('processed', false);

  } catch (error) {
    console.error('Error processing GHL update:', error);
  }
}