import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id } = await req.json();
    if (!booking_id) {
      return new Response("missing booking_id", { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get booking + service + recipients
    const { data: booking, error: bErr } = await supabase
      .from("consultation_bookings")
      .select("id, service_id, agent_email, agent_name")
      .eq("id", booking_id)
      .single();
    
    if (bErr || !booking) {
      console.error("Booking fetch error:", bErr);
      throw bErr ?? new Error("Booking not found");
    }

    const { data: service, error: sErr } = await supabase
      .from("services")
      .select("title, consultation_emails")
      .eq("id", booking.service_id)
      .single();
    
    if (sErr || !service) {
      console.error("Service fetch error:", sErr);
      throw sErr ?? new Error("Service not found");
    }

    const recipients: string[] = (service.consultation_emails ?? []).filter(Boolean);
    
    if (recipients.length === 0) {
      console.log("No recipients found for consultation alert");
      return new Response("no recipients", { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Resend client
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Send consultation alert email
    const emailHTML = `
      <h2>New Consultation Booking Alert</h2>
      <p><strong>Service:</strong> ${service.title}</p>
      <p><strong>Agent Name:</strong> ${booking.agent_name}</p>
      <p><strong>Agent Email:</strong> ${booking.agent_email}</p>
      <p><strong>Booking ID:</strong> ${booking.id}</p>
      <p>A new consultation has been booked for your service. Please follow up with the agent accordingly.</p>
    `;

    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Circle Marketplace <no-reply@resend.dev>",
        to: recipients,
        subject: `New Consultation Booking: ${service.title}`,
        html: emailHTML,
      });

      if (emailError) {
        console.error("Failed to send consultation alert:", emailError);
        throw emailError;
      }

      console.log("Consultation alert sent successfully:", {
        recipients: recipients.length,
        emailId: emailData?.id
      });

      return new Response(JSON.stringify({ 
        success: true, 
        recipients: recipients.length,
        booking_id,
        email_sent: true,
        email_id: emailData?.id
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (emailErr: any) {
      console.error("Email sending failed:", emailErr);
      // Still return success for the booking process, but log the email failure
      return new Response(JSON.stringify({ 
        success: true, 
        recipients: recipients.length,
        booking_id,
        email_sent: false,
        error: "Failed to send notification email"
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (e: any) {
    console.error("Consultation alert error:", e);
    return new Response(JSON.stringify({ 
      error: String(e?.message ?? e) 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});