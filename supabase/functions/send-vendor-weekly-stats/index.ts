import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { VendorWeeklyStatsEmail } from './_templates/vendor-weekly-stats.tsx';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface VendorStats {
  id: string;
  name: string;
  contact_email: string;
  has_agreement: boolean;
  card_views: number;
  funnel_views: number;
  bookings: number;
  revenue: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting weekly vendor stats email process...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get date range for the past week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    const weekStartStr = startDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const weekEndStr = endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });

    console.log(`📅 Fetching stats for week: ${weekStartStr} - ${weekEndStr}`);

    // Fetch active vendors with their stats and notification preferences
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select(`
        id,
        name,
        contact_email,
        circle_commission_percentage,
        email_notifications_enabled,
        weekly_stats_enabled,
        weekly_stats_frequency,
        stats_include_views,
        stats_include_bookings,
        stats_include_revenue,
        stats_include_conversions,
        agreement_reminders_enabled,
        services!inner(
          id,
          title
        )
      `)
      .eq('is_active', true)
      .eq('email_notifications_enabled', true)
      .eq('weekly_stats_enabled', true)
      .not('contact_email', 'is', null)
      .not('contact_email', 'eq', '');

    if (vendorsError) {
      console.error('❌ Error fetching vendors:', vendorsError);
      throw vendorsError;
    }

    console.log(`👥 Found ${vendors?.length || 0} active vendors with email addresses`);

    if (!vendors || vendors.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active vendors found' }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const emailPromises = vendors.map(async (vendor) => {
      try {
        console.log(`📊 Processing stats for vendor: ${vendor.name}`);

        // Get service IDs for this vendor
        const serviceIds = vendor.services.map((s: any) => s.id);

        if (serviceIds.length === 0) {
          console.log(`⚠️ No services found for vendor: ${vendor.name}`);
          return null;
        }

        // Fetch tracking events for the past week
        const { data: events, error: eventsError } = await supabase
          .from('service_tracking_events')
          .select('event_type, revenue_attributed, service_id')
          .in('service_id', serviceIds)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (eventsError) {
          console.error(`❌ Error fetching events for ${vendor.name}:`, eventsError);
          return null;
        }

        // Calculate stats
        const cardViews = events?.filter(e => e.event_type === 'view').length || 0;
        const funnelViews = events?.filter(e => e.event_type === 'click').length || 0;
        const bookings = events?.filter(e => e.event_type === 'booking').length || 0;
        const revenue = events?.reduce((sum, e) => sum + (e.revenue_attributed || 0), 0) || 0;

        // Check if vendor has agreement (commission percentage > 0 indicates agreement)
        const hasAgreement = (vendor.circle_commission_percentage || 0) > 0;

        console.log(`📈 Stats for ${vendor.name}: ${cardViews} views, ${bookings} bookings, $${revenue} revenue`);

        // Skip sending if all stats are zero
        if (cardViews === 0 && funnelViews === 0 && bookings === 0 && revenue === 0) {
          console.log(`⏭️ Skipping ${vendor.name} - no activity this week`);
          return null;
        }

        // Render the email template with vendor preferences
        const html = await renderAsync(
          React.createElement(VendorWeeklyStatsEmail, {
            vendorName: vendor.name,
            weekStartDate: weekStartStr,
            weekEndDate: weekEndStr,
            cardViews: vendor.stats_include_views ? cardViews : 0,
            funnelViews: vendor.stats_include_conversions ? funnelViews : 0,
            bookings: vendor.stats_include_bookings ? bookings : 0,
            revenue: vendor.stats_include_revenue ? revenue : 0,
            hasAgreement,
            dashboardUrl: `${Deno.env.get('SITE_URL') || 'https://app.circle.com'}/vendor-dashboard`,
            includeViews: vendor.stats_include_views ?? true,
            includeBookings: vendor.stats_include_bookings ?? true,
            includeRevenue: vendor.stats_include_revenue ?? true,
            includeConversions: vendor.stats_include_conversions ?? true,
            showAgreementCTA: !hasAgreement && (vendor.agreement_reminders_enabled ?? true),
          })
        );

        // Send the email
        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: 'Circle Marketplace <noreply@circle.com>',
          to: [vendor.contact_email],
          subject: `📊 Your Weekly Stats: ${cardViews} views, ${bookings} bookings`,
          html,
        });

        if (emailError) {
          console.error(`❌ Failed to send email to ${vendor.name}:`, emailError);
          return null;
        }

        console.log(`✅ Successfully sent weekly stats email to ${vendor.name}`);
        return emailResult;

      } catch (error) {
        console.error(`❌ Error processing vendor ${vendor.name}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    const failed = results.length - successful;

    console.log(`✅ Weekly stats emails sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: 'Weekly vendor stats emails processed',
        sent: successful,
        failed: failed,
        total: vendors.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in send-vendor-weekly-stats function:', error);
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