import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { VendorMonthlyReport } from './_templates/vendor-monthly-report.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VendorReportRequest {
  month?: string; // YYYY-MM format, defaults to last month
  vendor_id?: string; // Optional: generate report for specific vendor
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json() as VendorReportRequest;
    
    // Default to last month if no month specified
    const reportDate = body.month ? new Date(body.month + '-01') : new Date();
    if (!body.month) {
      reportDate.setMonth(reportDate.getMonth() - 1);
    }
    
    const reportMonth = reportDate.toISOString().slice(0, 7); // YYYY-MM
    const monthStart = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
    const monthEnd = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0);

    console.log(`Generating vendor reports for ${reportMonth}`);

    // Get vendors with clicks in the specified month
    const { data: vendorClicks, error: vendorError } = await supabase
      .from('outbound_clicks')
      .select(`
        vendor_id,
        service_id,
        agent_id,
        clicked_at,
        ip_address,
        services (
          id,
          title,
          vendor_id
        ),
        profiles!outbound_clicks_agent_id_fkey (
          user_id,
          display_name,
          city,
          state,
          years_experience
        )
      `)
      .gte('clicked_at', monthStart.toISOString())
      .lte('clicked_at', monthEnd.toISOString())
      .not('vendor_id', 'is', null)
      .eq('vendor_id', body.vendor_id || undefined); // Filter by vendor if specified

    if (vendorError) {
      console.error('Error fetching vendor clicks:', vendorError);
      throw vendorError;
    }

    // Group clicks by vendor
    const vendorData = new Map();
    
    vendorClicks?.forEach(click => {
      if (!click.vendor_id) return;
      
      if (!vendorData.has(click.vendor_id)) {
        vendorData.set(click.vendor_id, {
          clicks: [],
          services: new Map(),
          agents: new Set(),
          locations: new Map()
        });
      }
      
      const data = vendorData.get(click.vendor_id);
      data.clicks.push(click);
      
      // Track services
      if (click.services) {
        const serviceKey = click.services.title;
        if (!data.services.has(serviceKey)) {
          data.services.set(serviceKey, { clicks: 0, agents: new Set() });
        }
        data.services.get(serviceKey).clicks++;
        data.services.get(serviceKey).agents.add(click.agent_id);
      }
      
      // Track agents
      data.agents.add(click.agent_id);
      
      // Track locations
      if (click.profiles?.city && click.profiles?.state) {
        const location = `${click.profiles.city}, ${click.profiles.state}`;
        if (!data.locations.has(location)) {
          data.locations.set(location, { clicks: 0, agents: new Set() });
        }
        data.locations.get(location).clicks++;
        data.locations.get(location).agents.add(click.agent_id);
      }
    });

    // Get vendor details
    const vendorIds = Array.from(vendorData.keys());
    const { data: vendors, error: vendorsError } = await supabase
      .from('profiles')
      .select('user_id, display_name, business_name, email')
      .in('user_id', vendorIds);

    if (vendorsError) {
      console.error('Error fetching vendors:', vendorsError);
      throw vendorsError;
    }

    const reportsGenerated = [];

    // Generate reports for each vendor
    for (const vendor of vendors || []) {
      const data = vendorData.get(vendor.user_id);
      if (!data || data.clicks.length === 0) continue;

      // Format service data
      const topServices = Array.from(data.services.entries())
        .map(([name, stats]) => ({
          service_name: name,
          clicks: stats.clicks,
          unique_agents: stats.agents.size
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      // Format location data
      const geographic_breakdown = Array.from(data.locations.entries())
        .map(([location, stats]) => ({
          location,
          clicks: stats.clicks,
          agents: stats.agents.size
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      // Format agent profiles
      const agentProfiles = data.clicks
        .filter(click => click.profiles)
        .reduce((acc, click) => {
          const agentKey = click.agent_id;
          if (!acc.has(agentKey)) {
            acc.set(agentKey, {
              agent_name: click.profiles.display_name || 'Anonymous Agent',
              experience_level: click.profiles.years_experience 
                ? `${click.profiles.years_experience} years` 
                : 'Not specified',
              location: click.profiles.city && click.profiles.state
                ? `${click.profiles.city}, ${click.profiles.state}`
                : 'Not specified',
              clicks: 0
            });
          }
          acc.get(agentKey).clicks++;
          return acc;
        }, new Map());

      const agent_profiles = Array.from(agentProfiles.values())
        .sort((a, b) => b.clicks - a.clicks);

      // Calculate commission estimates (basic calculation)
      const commission_rate = 5; // Default 5% - could be stored in vendor profile
      const estimated_commission = data.clicks.length * 10; // $10 per qualified click estimate

      const reportData = {
        vendor_name: vendor.business_name || vendor.display_name || 'Vendor',
        vendor_email: vendor.email,
        report_month: reportMonth,
        total_clicks: data.clicks.length,
        unique_agents: data.agents.size,
        top_services,
        geographic_breakdown,
        agent_profiles,
        commission_rate,
        estimated_commission
      };

      // Generate HTML email
      const html = await renderAsync(
        React.createElement(VendorMonthlyReport, reportData)
      );

      // Send email
      const { data: emailResult, error: emailError } = await resend.emails.send({
        from: "Circle Platform Reports <reports@circle-platform.com>",
        to: [vendor.email],
        subject: `Circle Platform - Monthly Traffic Report for ${reportMonth}`,
        html,
      });

      if (emailError) {
        console.error(`Error sending email to ${vendor.email}:`, emailError);
        reportsGenerated.push({
          vendor_id: vendor.user_id,
          vendor_name: reportData.vendor_name,
          status: 'failed',
          error: emailError.message
        });
      } else {
        console.log(`Report sent successfully to ${vendor.email}`);
        reportsGenerated.push({
          vendor_id: vendor.user_id,
          vendor_name: reportData.vendor_name,
          status: 'sent',
          email_id: emailResult?.id,
          total_clicks: data.clicks.length,
          unique_agents: data.agents.size
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        report_month: reportMonth,
        reports_generated: reportsGenerated.length,
        details: reportsGenerated
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-vendor-reports function:", error);
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