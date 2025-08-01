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
      vendor_email,
      service_title
    });

    // Get detailed co-pay request info if not provided
    let requestDetails = {
      agent_email,
      vendor_email,
      agent_name,
      vendor_name,
      service_title,
      split_percentage
    };

    if (!agent_email || !vendor_email || !service_title) {
      const { data: coPayData, error: fetchError } = await supabase
        .from('co_pay_requests')
        .select(`
          *,
          vendors!vendor_id (
            name,
            contact_email,
            individual_email,
            individual_name
          )
        `)
        .eq('id', co_pay_request_id)
        .single();

      if (!fetchError && coPayData) {
        // Get agent details from auth in parallel
        const agentPromise = supabase.auth.admin.getUserById(coPayData.agent_id);
        
        requestDetails = {
          agent_email: agent_email,
          vendor_email: coPayData.vendors?.contact_email || coPayData.vendors?.individual_email || vendor_email,
          agent_name: agent_name || 'Agent',
          vendor_name: coPayData.vendors?.name || vendor_name,
          service_title: service_title || 'Service',
          split_percentage: coPayData.requested_split_percentage || split_percentage
        };

        // Wait for agent data and update email if needed
        try {
          const { data: agentAuth } = await agentPromise;
          if (agentAuth?.user?.email) {
            requestDetails.agent_email = agentAuth.user.email;
          }
        } catch (error) {
          console.warn('Could not fetch agent details:', error);
        }
      }
    }

    // Create notification record
    const notificationData = {
      notification_type,
      co_pay_request_id,
      ...requestDetails,
      requires_calendar_booking: notification_type === 'request_created',
      sent_at: new Date().toISOString()
    };

    // Run notification and audit log insertions in parallel
    const [notificationResult, auditResult] = await Promise.allSettled([
      supabase
        .from('consultation_notifications')
        .insert({
          vendor_id: co_pay_request_id, // Using as reference since we don't have direct vendor_id
          consultation_booking_id: co_pay_request_id,
          notification_type: `copay_${notification_type}`,
          notification_data: notificationData,
          status: 'sent',
          sent_at: new Date().toISOString()
        }),
      
      supabase
        .from('co_pay_audit_log')
        .insert({
          co_pay_request_id,
          action_type: `notification_${notification_type}`,
          action_details: {
            ...notificationData,
            success: true
          }
        })
    ]);

    // Log any insertion errors but don't fail the request
    if (notificationResult.status === 'rejected') {
      console.warn('Notification insertion failed:', notificationResult.reason);
    }
    if (auditResult.status === 'rejected') {
      console.warn('Audit log insertion failed:', auditResult.reason);
    }

    // Simulate immediate vendor notification for new requests
    if (notification_type === 'request_created') {
      console.log('🚨 VENDOR ALERT: New Co-Pay Request!', {
        vendor_email: requestDetails.vendor_email,
        vendor_name: requestDetails.vendor_name,
        message: `${requestDetails.agent_name} (${requestDetails.agent_email}) has requested a ${requestDetails.split_percentage}% co-pay split for "${requestDetails.service_title}".`,
        action_required: 'IMMEDIATE RESPONSE NEEDED - You have 3 days to respond.',
        calendar_booking: 'Please schedule a consultation with the agent if the service requires it.',
        response_options: ['Approve', 'Decline', 'Request More Info']
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Co-pay notification sent: ${notification_type}`,
        co_pay_request_id,
        vendor_notified: true,
        calendar_booking_required: notification_type === 'request_created',
        details: requestDetails
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-copay-notification function:", error);
    
    // Log the error
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await supabase
      .from('co_pay_audit_log')
      .insert({
        co_pay_request_id: 'unknown',
        action_type: 'notification_error',
        action_details: {
          error: error.message,
          stack: error.stack
        }
      });

    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);