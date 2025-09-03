import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface VendorNotificationRequest {
  vendorId: string;
  type: 'review' | 'booking';
  data: {
    customerName?: string;
    serviceName?: string;
    rating?: number;
    reviewText?: string;
    bookingDate?: string;
    bookingTime?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { vendorId, type, data }: VendorNotificationRequest = await req.json();

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('name, contact_email, email_notifications_enabled')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      throw new Error('Vendor not found');
    }

    // Check if email notifications are enabled
    if (!vendor.email_notifications_enabled) {
      return new Response(JSON.stringify({ message: 'Email notifications disabled for vendor' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Generate email content based on notification type
    let subject: string;
    let html: string;

    if (type === 'review') {
      subject = `New Review for ${vendor.name}`;
      const stars = '★'.repeat(data.rating || 0) + '☆'.repeat(5 - (data.rating || 0));
      html = `
        <h2>You have a new review!</h2>
        <p><strong>Customer:</strong> ${data.customerName || 'Anonymous'}</p>
        <p><strong>Service:</strong> ${data.serviceName}</p>
        <p><strong>Rating:</strong> ${stars} (${data.rating}/5)</p>
        ${data.reviewText ? `<p><strong>Review:</strong> "${data.reviewText}"</p>` : ''}
        <p>Login to your vendor dashboard to respond to this review.</p>
      `;
    } else {
      subject = `New Booking for ${vendor.name}`;
      html = `
        <h2>You have a new booking!</h2>
        <p><strong>Customer:</strong> ${data.customerName}</p>
        <p><strong>Service:</strong> ${data.serviceName}</p>
        <p><strong>Date:</strong> ${data.bookingDate}</p>
        <p><strong>Time:</strong> ${data.bookingTime}</p>
        <p>Login to your vendor dashboard to manage this booking.</p>
      `;
    }

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "Circle Marketplace <notifications@circle-marketplace.com>",
      to: [vendor.contact_email],
      subject: subject,
      html: html,
    });

    console.log('Vendor notification email sent:', emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error sending vendor notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);