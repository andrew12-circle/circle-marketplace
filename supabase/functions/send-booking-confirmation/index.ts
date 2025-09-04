import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

interface BookingConfirmationRequest {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceTitle: string;
  vendorName: string;
  scheduledDate: string;
  scheduledTime: string;
  projectDetails?: string;
}

// Helper function to generate ICS content
function generateICSFile(booking: {
  client_name: string;
  client_email: string;
  client_phone?: string;
  scheduled_date: string;
  scheduled_time: string;
  project_details?: string;
  service_title: string;
  vendor_name: string;
}) {
  const startDate = new Date(`${booking.scheduled_date}T${convertTimeToISOTime(booking.scheduled_time)}`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Circle Marketplace//Consultation Booking//EN',
    'BEGIN:VEVENT',
    `UID:booking-${Date.now()}@circlemarketplace.io`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:Consultation: ${booking.service_title}`,
    `DESCRIPTION:Consultation with ${booking.vendor_name}\\n` +
    `Phone: ${booking.client_phone || 'Not provided'}\\n\\n` +
    `Project Details:\\n${booking.project_details || 'No details provided'}\\n\\n` +
    `Booking ID: ${booking.client_name.replace(/\s+/g, '-')}-${booking.scheduled_date}`,
    `ATTENDEE;CN=${booking.client_name}:mailto:${booking.client_email}`,
    `ORGANIZER;CN=${booking.vendor_name}:mailto:hello@circlemarketplace.io`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

function convertTimeToISOTime(timeString: string): string {
  // Convert "11:00 AM CST" to "11:00:00"
  const time = timeString.replace(/\s*(AM|PM|CST|EST|PST|MST)\s*/gi, '');
  const [hours, minutes] = time.split(':');
  let hour24 = parseInt(hours);
  
  if (timeString.toLowerCase().includes('pm') && hour24 !== 12) {
    hour24 += 12;
  } else if (timeString.toLowerCase().includes('am') && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes || '00'}:00`;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      bookingId,
      clientName,
      clientEmail,
      clientPhone,
      serviceTitle,
      vendorName,
      scheduledDate,
      scheduledTime,
      projectDetails
    }: BookingConfirmationRequest = await req.json();

    console.log('Sending booking confirmation to:', clientEmail);

    // Generate ICS file content
    const booking = {
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      project_details: projectDetails,
      service_title: serviceTitle,
      vendor_name: vendorName
    };
    
    const icsContent = generateICSFile(booking);

    // Send confirmation email to client
    const emailResponse = await resend.emails.send({
      from: "Circle Marketplace <confirmations@circlemarketplace.io>",
      to: [clientEmail],
      subject: `✅ Consultation Confirmed - ${serviceTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
          <div style="background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #22c55e; font-size: 28px; margin: 0;">✅ Consultation Confirmed!</h1>
              <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0 0;">Your booking has been received and confirmed</p>
            </div>
            
            <!-- Success Banner -->
            <div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
              <h3 style="color: #166534; margin: 0 0 8px 0;">🎉 You're all set!</h3>
              <p style="color: #166534; margin: 0; font-weight: 500;">Your consultation request has been confirmed and ${vendorName} will contact you soon.</p>
            </div>

            <!-- Booking Details -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">📋 Your Consultation Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Service:</td>
                  <td style="padding: 8px 12px; color: #4b5563; border-bottom: 1px solid #e5e7eb;">${serviceTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Provider:</td>
                  <td style="padding: 8px 12px; color: #4b5563; border-bottom: 1px solid #e5e7eb;">${vendorName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Date & Time:</td>
                  <td style="padding: 8px 12px; color: #4b5563; border-bottom: 1px solid #e5e7eb;">${scheduledDate} at ${scheduledTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Your Name:</td>
                  <td style="padding: 8px 12px; color: #4b5563; border-bottom: 1px solid #e5e7eb;">${clientName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #374151;">Your Email:</td>
                  <td style="padding: 8px 12px; color: #4b5563;">${clientEmail}</td>
                </tr>
                ${clientPhone ? `
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #374151;">Your Phone:</td>
                  <td style="padding: 8px 12px; color: #4b5563;">${clientPhone}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${projectDetails ? `
            <div style="background: #eff6ff; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 10px 0;">📝 Your Project Details</h3>
              <p style="color: #4b5563; margin: 0; line-height: 1.6;">${projectDetails}</p>
            </div>
            ` : ''}

            <!-- Next Steps -->
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
              <h3 style="color: #92400e; margin: 0 0 10px 0;">📞 What happens next?</h3>
              <ul style="color: #92400e; margin: 10px 0 0 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">${vendorName} will contact you within 24 hours to confirm the consultation</li>
                <li style="margin-bottom: 8px;">They'll discuss the project details and answer any preliminary questions</li>
                <li style="margin-bottom: 8px;">If needed, they may suggest adjusting the meeting time</li>
                <li>A calendar invitation is attached to this email for your convenience</li>
              </ul>
            </div>

            <!-- Contact Info -->
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f3f4f6; border-radius: 6px;">
              <h3 style="color: #1f2937; margin: 0 0 10px 0;">Need to make changes?</h3>
              <p style="color: #6b7280; margin: 0 0 15px 0;">If you need to reschedule or have questions:</p>
              <p style="margin: 0;">
                <a href="mailto:hello@circlemarketplace.io?subject=Booking%20Question%20-%20${bookingId}" 
                   style="color: #3b82f6; text-decoration: none; font-weight: 500;">
                  📧 hello@circlemarketplace.io
                </a>
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                Booking ID: ${bookingId}<br>
                Circle Marketplace - Connecting agents with trusted service providers
              </p>
            </div>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `consultation-${scheduledDate}.ics`,
          content: Buffer.from(icsContent).toString('base64'),
          type: 'text/calendar',
          disposition: 'attachment'
        }
      ]
    });

    console.log('Confirmation email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Booking confirmation sent successfully',
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error sending booking confirmation:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send booking confirmation',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);