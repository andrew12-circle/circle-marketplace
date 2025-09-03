import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@4.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { AffiliateClickNotification } from "./_templates/affiliate-click-notification.tsx";
import { AffiliateConversionNotification } from "./_templates/affiliate-conversion-notification.tsx";
import { AffiliateWelcomeEmail } from "./_templates/affiliate-welcome-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "affiliates@resend.dev";
const RESEND_FROM_NAME = Deno.env.get("RESEND_FROM_NAME") || "Circle Affiliate Program";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface AffiliateNotificationRequest {
  notification_type: 'click_notification' | 'conversion_notification' | 'welcome_email' | 'monthly_summary';
  affiliate_id?: string;
  affiliate_email?: string;
  affiliate_name?: string;
  click_data?: {
    source_url: string;
    user_agent: string;
    referrer: string;
    utm_source?: string;
    utm_campaign?: string;
    timestamp: string;
  };
  conversion_data?: {
    conversion_type: string;
    amount_gross: number;
    commission_amount: number;
    order_id?: string;
    subscription_id?: string;
    service_title?: string;
    timestamp: string;
  };
  monthly_data?: {
    total_clicks: number;
    total_conversions: number;
    total_commission: number;
    month: string;
    year: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      notification_type, 
      affiliate_id, 
      affiliate_email, 
      affiliate_name,
      click_data, 
      conversion_data,
      monthly_data 
    }: AffiliateNotificationRequest = await req.json();

    console.log('Processing affiliate notification:', { notification_type, affiliate_id });

    // Get affiliate details if not provided
    let emailAddress = affiliate_email;
    let affiliateName = affiliate_name;

    if (!emailAddress && affiliate_id) {
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('email, name')
        .eq('id', affiliate_id)
        .single();

      if (affiliateError) {
        console.error('Error fetching affiliate:', affiliateError);
        throw new Error('Affiliate not found');
      }

      emailAddress = affiliateData.email;
      affiliateName = affiliateData.name;
    }

    if (!emailAddress) {
      throw new Error('Affiliate email is required');
    }

    let emailHtml = '';
    let emailSubject = '';

    // Generate email content based on notification type
    switch (notification_type) {
      case 'click_notification':
        if (!click_data) throw new Error('Click data is required for click notifications');
        
        emailHtml = await renderAsync(
          React.createElement(AffiliateClickNotification, {
            affiliateName: affiliateName || 'Valued Partner',
            clickData: click_data
          })
        );
        emailSubject = 'New Click on Your Affiliate Link!';
        break;

      case 'conversion_notification':
        if (!conversion_data) throw new Error('Conversion data is required for conversion notifications');
        
        emailHtml = await renderAsync(
          React.createElement(AffiliateConversionNotification, {
            affiliateName: affiliateName || 'Valued Partner',
            conversionData: conversion_data
          })
        );
        emailSubject = `Congratulations! You earned $${conversion_data.commission_amount.toFixed(2)}`;
        break;

      case 'welcome_email':
        emailHtml = await renderAsync(
          React.createElement(AffiliateWelcomeEmail, {
            affiliateName: affiliateName || 'New Partner',
            affiliateId: affiliate_id || ''
          })
        );
        emailSubject = 'Welcome to the Circle Affiliate Program!';
        break;

      case 'monthly_summary':
        if (!monthly_data) throw new Error('Monthly data is required for monthly summary');
        // TODO: Create monthly summary template
        emailSubject = `Your ${monthly_data.month} ${monthly_data.year} Affiliate Summary`;
        emailHtml = `<p>Monthly summary functionality coming soon!</p>`;
        break;

      default:
        throw new Error(`Unknown notification type: ${notification_type}`);
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
      to: [emailAddress],
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);

    // Log the notification
    await supabase
      .from('affiliate_email_logs')
      .insert({
        affiliate_id,
        notification_type,
        email_address: emailAddress,
        email_id: data.id,
        sent_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: data.id,
        message: `${notification_type} email sent successfully` 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-affiliate-notification:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);