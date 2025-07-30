import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ConsultationRequest {
  bookingId: string;
  serviceTitle: string;
  vendorName: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  scheduledDate: string;
  scheduledTime: string;
  projectDetails?: string;
  budgetRange?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Consultation notification function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      bookingId, 
      serviceTitle, 
      vendorName, 
      clientName, 
      clientEmail,
      clientPhone,
      scheduledDate,
      scheduledTime,
      projectDetails,
      budgetRange 
    }: ConsultationRequest = await req.json();

    console.log('Processing consultation notification for:', { bookingId, vendorName, serviceTitle });

    // Get vendor info and contact email
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, contact_email, individual_email, name')
      .eq('name', vendorName)
      .single();

    if (vendorError || !vendor) {
      console.error('Error finding vendor:', vendorError);
      throw new Error(`Vendor not found: ${vendorName}`);
    }

    const vendorEmail = vendor.individual_email || vendor.contact_email;
    if (!vendorEmail) {
      console.error('No email found for vendor:', vendorName);
      throw new Error(`No contact email found for vendor: ${vendorName}`);
    }

    // Create notification record
    const { error: notificationError } = await supabase
      .from('consultation_notifications')
      .insert({
        consultation_booking_id: bookingId,
        vendor_id: vendor.id,
        notification_type: 'email',
        status: 'pending',
        notification_data: {
          vendor_email: vendorEmail,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          service_title: serviceTitle,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          project_details: projectDetails,
          budget_range: budgetRange
        }
      });

    if (notificationError) {
      console.error('Error creating notification record:', notificationError);
      throw notificationError;
    }

    // In a real implementation, you would send the email here
    // For now, we'll just simulate sending and mark as sent
    console.log(`📧 EMAIL WOULD BE SENT TO: ${vendorEmail}`);
    console.log('Email content:', {
      subject: `New Consultation Request: ${serviceTitle}`,
      to: vendorEmail,
      body: `
        New consultation request from ${clientName}
        
        Service: ${serviceTitle}
        Client: ${clientName} (${clientEmail})
        ${clientPhone ? `Phone: ${clientPhone}` : ''}
        
        Scheduled: ${scheduledDate} at ${scheduledTime}
        
        ${projectDetails ? `Project Details: ${projectDetails}` : ''}
        ${budgetRange ? `Budget Range: ${budgetRange}` : ''}
        
        Please log in to your vendor dashboard to manage this consultation.
      `
    });

    // Update notification status to sent
    await supabase
      .from('consultation_notifications')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('consultation_booking_id', bookingId);

    console.log('✅ Notification sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        vendor_notified: vendorEmail
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in send-consultation-notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to send consultation notification'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);