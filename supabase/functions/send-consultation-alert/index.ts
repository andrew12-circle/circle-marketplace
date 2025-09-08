import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      // Log that no recipients were found
      console.log("No recipients found for consultation alert");
      return new Response("no recipients", { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For now, just log the email that would be sent
    // In production, integrate with Resend or your email service
    console.log("Would send consultation alert:", {
      to: recipients,
      booking: booking,
      service: service.title
    });

    return new Response(JSON.stringify({ 
      success: true, 
      recipients: recipients.length,
      booking_id 
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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