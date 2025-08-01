import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  subject: string;
  type: 'welcome' | 'consultation_booked' | 'consultation_reminder' | 'co_pay_approved' | 'co_pay_denied' | 'generic';
  data?: Record<string, any>;
}

const getEmailTemplate = (type: string, data: Record<string, any> = {}) => {
  switch (type) {
    case 'welcome':
      return {
        subject: 'Welcome to Circle Network!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to Circle Network!</h1>
            <p>Thank you for joining our platform. We're excited to have you as part of our community.</p>
            <p>You can now:</p>
            <ul>
              <li>Browse and book professional services</li>
              <li>Access our academy content</li>
              <li>Connect with verified vendors</li>
            </ul>
            <p>Get started by exploring our marketplace!</p>
            <a href="${data.platformUrl || 'https://ihzyuyfawapweamqzzlj.lovable.app'}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Explore Marketplace
            </a>
          </div>
        `
      };

    case 'consultation_booked':
      return {
        subject: 'Consultation Booked Successfully',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Consultation Booked!</h1>
            <p>Your consultation has been successfully booked.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Consultation Details:</h3>
              <p><strong>Service:</strong> ${data.serviceName || 'N/A'}</p>
              <p><strong>Date:</strong> ${data.date || 'N/A'}</p>
              <p><strong>Time:</strong> ${data.time || 'N/A'}</p>
              <p><strong>Vendor:</strong> ${data.vendorName || 'N/A'}</p>
            </div>
            <p>You will receive a reminder email 24 hours before your consultation.</p>
          </div>
        `
      };

    case 'consultation_reminder':
      return {
        subject: 'Consultation Reminder - Tomorrow',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Consultation Reminder</h1>
            <p>This is a reminder that you have a consultation scheduled for tomorrow.</p>
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Consultation Details:</h3>
              <p><strong>Service:</strong> ${data.serviceName || 'N/A'}</p>
              <p><strong>Date:</strong> ${data.date || 'N/A'}</p>
              <p><strong>Time:</strong> ${data.time || 'N/A'}</p>
              <p><strong>Vendor:</strong> ${data.vendorName || 'N/A'}</p>
            </div>
            <p>Please make sure to be available at the scheduled time.</p>
          </div>
        `
      };

    case 'co_pay_approved':
      return {
        subject: 'Co-Pay Request Approved',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #28a745;">Co-Pay Request Approved!</h1>
            <p>Great news! Your co-pay request has been approved.</p>
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Request Details:</h3>
              <p><strong>Service:</strong> ${data.serviceName || 'N/A'}</p>
              <p><strong>Split Percentage:</strong> ${data.splitPercentage || 'N/A'}%</p>
              <p><strong>Your Share:</strong> ${data.agentShare || 'N/A'}</p>
            </div>
            <p>You can now proceed with the service at the approved co-pay rate.</p>
          </div>
        `
      };

    case 'co_pay_denied':
      return {
        subject: 'Co-Pay Request Update',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc3545;">Co-Pay Request Not Approved</h1>
            <p>Unfortunately, your co-pay request was not approved at this time.</p>
            <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Request Details:</h3>
              <p><strong>Service:</strong> ${data.serviceName || 'N/A'}</p>
              <p><strong>Requested Split:</strong> ${data.splitPercentage || 'N/A'}%</p>
              ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            </div>
            <p>You can still purchase this service at the regular pro price, or contact the vendor directly to discuss alternative arrangements.</p>
          </div>
        `
      };

    default:
      return {
        subject: data.subject || 'Notification from Circle Network',
        html: data.html || '<p>You have a new notification from Circle Network.</p>'
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, type, data }: NotificationRequest = await req.json();

    if (!to) {
      throw new Error("Recipient email is required");
    }

    const template = getEmailTemplate(type, data || {});
    const emailSubject = subject || template.subject;

    const emailResponse = await resend.emails.send({
      from: "Circle Network <notifications@resend.dev>",
      to: [to],
      subject: emailSubject,
      html: template.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
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