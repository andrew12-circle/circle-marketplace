import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentSchedule {
  id: string;
  co_pay_request_id: string;
  agent_id: string;
  vendor_id: string;
  payment_percentage: number;
  end_date: string;
  auto_renewal: boolean;
  agent_profile?: {
    display_name?: string;
    business_name?: string;
    email?: string;
  };
  service?: {
    title?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Checking for payment schedules expiring soon...');

    // Find payment schedules expiring in the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringSchedules, error: fetchError } = await supabaseClient
      .from('copay_payment_schedules')
      .select(`
        *,
        co_pay_requests!inner (
          agent_id,
          service_id,
          services (
            title
          ),
          profiles!co_pay_requests_agent_id_fkey (
            display_name,
            business_name
          )
        )
      `)
      .eq('status', 'active')
      .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .gt('end_date', new Date().toISOString().split('T')[0]);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${expiringSchedules?.length || 0} expiring schedules`);

    const notifications = [];

    for (const schedule of expiringSchedules || []) {
      const daysUntilExpiry = Math.ceil(
        (new Date(schedule.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if we already sent a notification for this schedule recently
      const { data: existingNotifications } = await supabaseClient
        .from('consultation_notifications')
        .select('id')
        .eq('vendor_id', schedule.vendor_id)
        .eq('notification_type', 'payment_schedule_renewal')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .like('notification_data', `%"schedule_id":"${schedule.id}"%`);

      if (existingNotifications && existingNotifications.length > 0) {
        console.log(`Notification already sent for schedule ${schedule.id}`);
        continue;
      }

      const notificationData = {
        schedule_id: schedule.id,
        agent_name: schedule.co_pay_requests?.profiles?.display_name || 'Unknown Agent',
        agent_business: schedule.co_pay_requests?.profiles?.business_name,
        service_title: schedule.co_pay_requests?.services?.title || 'Unknown Service',
        current_percentage: schedule.payment_percentage,
        expires_on: schedule.end_date,
        days_until_expiry: daysUntilExpiry,
        auto_renewal: schedule.auto_renewal
      };

      const { error: notificationError } = await supabaseClient
        .from('consultation_notifications')
        .insert({
          vendor_id: schedule.vendor_id,
          consultation_booking_id: schedule.co_pay_request_id,
          notification_type: 'payment_schedule_renewal',
          notification_data: notificationData,
          status: 'pending'
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      } else {
        notifications.push(notificationData);
        console.log(`Created renewal notification for schedule ${schedule.id}`);
      }
    }

    // Also check for schedules that have already expired and mark them
    const { data: expiredSchedules, error: expiredError } = await supabaseClient
      .from('copay_payment_schedules')
      .select('id')
      .eq('status', 'active')
      .lt('end_date', new Date().toISOString().split('T')[0]);

    if (expiredError) {
      console.error('Error fetching expired schedules:', expiredError);
    } else if (expiredSchedules && expiredSchedules.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('copay_payment_schedules')
        .update({ status: 'expired' })
        .in('id', expiredSchedules.map(s => s.id));

      if (updateError) {
        console.error('Error updating expired schedules:', updateError);
      } else {
        console.log(`Marked ${expiredSchedules.length} schedules as expired`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: notifications.length,
        expired_schedules_updated: expiredSchedules?.length || 0,
        notifications
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in check-payment-schedule-renewals function:', error);
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