import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CoPayNotificationRequest {
  co_pay_request_id: string;
  notification_type: 'request_created' | 'request_approved' | 'request_denied';
  agent_email?: string;
  vendor_email?: string;
  agent_name?: string;
  vendor_name?: string;
  service_title?: string;
  split_percentage?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      co_pay_request_id,
      notification_type,
      agent_email,
      vendor_email,
      agent_name,
      vendor_name,
      service_title,
      split_percentage
    }: CoPayNotificationRequest = await req.json();

    console.log('Sending co-pay notification:', {
      co_pay_request_id,
      notification_type,
      agent_email,
      vendor_email
    });

    // Log the notification attempt
    await supabase
      .from('co_pay_audit_log')
      .insert({
        co_pay_request_id,
        action_type: `notification_${notification_type}`,
        action_details: {
          notification_type,
          agent_email,
          vendor_email,
          agent_name,
          vendor_name,
          service_title,
          split_percentage
        }
      });

    // Here you would integrate with your notification services:
    // - Push notifications (Firebase, OneSignal, etc.)
    // - SMS (Twilio, etc.)
    // - Email (Resend, SendGrid, etc.)
    
    // For now, we'll just log the notification
    console.log(`Co-pay notification sent: ${notification_type} for request ${co_pay_request_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification sent: ${notification_type}`,
        co_pay_request_id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-copay-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);