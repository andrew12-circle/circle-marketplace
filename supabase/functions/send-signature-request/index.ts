import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignatureRequest {
  co_pay_request_id: string;
  notification_type: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { co_pay_request_id, notification_type }: SignatureRequest = await req.json();
    
    console.log('Processing signature request for co-pay request:', co_pay_request_id);

    // Get co-pay request details with related data
    const { data: coPayRequest, error } = await supabase
      .from('co_pay_requests')
      .select(`
        *,
        agent:profiles!agent_id(display_name, email),
        vendor:profiles!vendor_id(display_name, email, business_name),
        service:services(title, retail_price)
      `)
      .eq('id', co_pay_request_id)
      .single();

    if (error) {
      console.error('Error fetching co-pay request:', error);
      throw error;
    }

    // Get the active agreement template
    const { data: template, error: templateError } = await supabase
      .from('comarketing_agreement_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (templateError) {
      console.error('Error fetching agreement template:', templateError);
      throw templateError;
    }

    // Generate the agreement content with dynamic values
    const agreementContent = template.template_content
      .replace(/\{\{agent_name\}\}/g, coPayRequest.agent?.display_name || 'Agent')
      .replace(/\{\{agent_email\}\}/g, coPayRequest.agent?.email || '')
      .replace(/\{\{vendor_name\}\}/g, coPayRequest.vendor?.business_name || coPayRequest.vendor?.display_name || 'Vendor')
      .replace(/\{\{vendor_email\}\}/g, coPayRequest.vendor?.email || '')
      .replace(/\{\{service_title\}\}/g, coPayRequest.service?.title || 'Service')
      .replace(/\{\{split_percentage\}\}/g, coPayRequest.requested_split_percentage?.toString() || '0')
      .replace(/\{\{request_date\}\}/g, new Date(coPayRequest.created_at).toLocaleDateString());

    // Update the co-pay request with agreement details
    const { error: updateError } = await supabase
      .from('co_pay_requests')
      .update({
        agreement_template_version: template.version,
        comarketing_agreement_url: `data:text/plain;base64,${btoa(agreementContent)}`
      })
      .eq('id', co_pay_request_id);

    if (updateError) {
      console.error('Error updating co-pay request with agreement:', updateError);
      throw updateError;
    }

    // Create notification records for both parties
    const notifications = [
      {
        consultation_booking_id: co_pay_request_id,
        vendor_id: coPayRequest.vendor_id,
        notification_type: 'signature_request_vendor',
        notification_data: {
          message: 'Your signature is required on the co-marketing agreement',
          co_pay_request_id,
          signer_type: 'vendor',
          agreement_content: agreementContent
        }
      },
      {
        consultation_booking_id: co_pay_request_id,
        vendor_id: coPayRequest.agent_id,
        notification_type: 'signature_request_agent', 
        notification_data: {
          message: 'Your signature is required on the co-marketing agreement',
          co_pay_request_id,
          signer_type: 'agent',
          agreement_content: agreementContent
        }
      }
    ];

    const { error: notificationError } = await supabase
      .from('consultation_notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Error creating signature request notifications:', notificationError);
      throw notificationError;
    }

    console.log('Signature request notifications sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Signature requests sent to both parties',
        agreement_version: template.version
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-signature-request function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500 
      }
    );
  }
});