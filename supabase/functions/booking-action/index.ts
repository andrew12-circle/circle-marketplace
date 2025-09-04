import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action');

    if (!token || !action) {
      return new Response('Missing token or action parameter', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    if (!['accept', 'decline'].includes(action)) {
      return new Response('Invalid action. Must be "accept" or "decline"', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Hash the token to match what's stored in database
    const encoder = new TextEncoder();
    const tokenHash = await crypto.subtle.digest('SHA-256', encoder.encode(token));
    const hashedToken = Array.from(new Uint8Array(tokenHash)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Find the token in database
    const { data: tokenData, error: tokenError } = await supabase
      .from('booking_action_tokens')
      .select(`
        *,
        consultation_bookings (
          id,
          client_name,
          client_email,
          scheduled_date,
          scheduled_time,
          status
        )
      `)
      .eq('token_hash', hashedToken)
      .eq('action_type', action)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; margin: 40px; text-align: center;">
            <h1>Invalid or Expired Link</h1>
            <p>This action link is either invalid or has expired.</p>
            <p>Please contact Circle Marketplace directly if you need assistance.</p>
          </body>
        </html>
      `, { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    }

    const booking = tokenData.consultation_bookings;
    if (!booking) {
      return new Response('Booking not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Mark token as used
    await supabase
      .from('booking_action_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    // Update booking status
    const newStatus = action === 'accept' ? 'vendor_confirmed' : 'vendor_declined';
    const vendorResponse = action === 'accept' ? 'accepted' : 'declined';

    await supabase
      .from('consultation_bookings')
      .update({ 
        status: newStatus,
        vendor_response: vendorResponse,
        status_updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    // Add a note to the booking
    await supabase
      .from('consultation_booking_notes')
      .insert({
        booking_id: booking.id,
        note_text: `Vendor ${action}ed the consultation via email link`,
        note_type: 'vendor_response'
      });

    // Return success page
    const actionText = action === 'accept' ? 'accepted' : 'declined';
    const statusColor = action === 'accept' ? '#22c55e' : '#ef4444';
    const statusIcon = action === 'accept' ? '✅' : '❌';

    return new Response(`
      <html>
        <head>
          <title>Consultation ${actionText}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 40px; text-align: center; background-color: #f9fafb;">
          <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="color: ${statusColor}; margin-bottom: 20px;">
              ${statusIcon} Consultation ${actionText}
            </h1>
            <p style="font-size: 18px; margin-bottom: 10px;">
              <strong>Client:</strong> ${booking.client_name}
            </p>
            <p style="font-size: 16px; margin-bottom: 10px;">
              <strong>Email:</strong> ${booking.client_email}
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>Scheduled:</strong> ${booking.scheduled_date} at ${booking.scheduled_time}
            </p>
            
            ${action === 'accept' ? `
              <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #166534; margin: 0; font-weight: bold;">
                  Thank you for accepting this consultation!
                </p>
                <p style="color: #166534; margin: 10px 0 0 0;">
                  Please reach out to the client directly to confirm details and prepare for the meeting.
                </p>
              </div>
            ` : `
              <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #991b1b; margin: 0; font-weight: bold;">
                  Consultation declined
                </p>
                <p style="color: #991b1b; margin: 10px 0 0 0;">
                  The client will be notified and Circle Marketplace will handle next steps.
                </p>
              </div>
            `}
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Circle Marketplace Team
            </p>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });

  } catch (error: any) {
    console.error('Error in booking-action function:', error);
    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; margin: 40px; text-align: center;">
          <h1>Error</h1>
          <p>An error occurred while processing your request. Please try again or contact support.</p>
        </body>
      </html>
    `, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });
  }
};

serve(handler);