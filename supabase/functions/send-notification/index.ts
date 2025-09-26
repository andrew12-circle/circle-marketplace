import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// import { Resend } from "npm:resend@2.0.0"; // Temporarily disabled

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "notifications@resend.dev";
const RESEND_FROM_NAME = Deno.env.get("RESEND_FROM_NAME") || "Circle Network";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to?: string;
  subject?: string;
  type: 'welcome' | 'consultation_booked' | 'consultation_reminder' | 'co_pay_approved' | 'co_pay_denied' | 'billing_support' | 'support_request' | 'generic';
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

    case 'billing_support':
      return {
        subject: 'Billing Support Request Received',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Billing Support Request</h1>
            <p>We've received your billing support request and our team will respond within 24 hours.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Request:</h3>
              <p><strong>Category:</strong> ${data.category || 'Billing'}</p>
              <p><strong>Subject:</strong> ${data.subject || 'N/A'}</p>
              <p><strong>Message:</strong> ${data.message || 'N/A'}</p>
            </div>
            <p>If this is urgent, you can also manage your subscription directly through your account settings.</p>
            <a href="${data.platformUrl || 'https://ihzyuyfawapweamqzzlj.lovable.app'}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Manage Subscription
            </a>
          </div>
        `
      };

    case 'support_request':
      return {
        subject: `Support Request: ${data.subject || 'Help Request'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">New Support Request</h1>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Request Details:</h3>
              <p><strong>From:</strong> ${data.userEmail || 'Unknown'}</p>
              <p><strong>Subject:</strong> ${data.subject || 'No subject'}</p>
              <p><strong>Page:</strong> ${data.currentPage || 'Unknown'}</p>
              <p><strong>Time:</strong> ${data.timestamp || 'Unknown'}</p>
              <div style="margin-top: 15px;">
                <strong>Message:</strong>
                <div style="background: white; padding: 15px; border-left: 4px solid #007bff; margin-top: 5px;">
                  ${data.message || 'No message provided'}
                </div>
              </div>
            </div>
            <p><em>Please respond within 24 hours as promised to the user.</em></p>
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

    // Handle support requests specially
    let recipientEmail = to;
    if (type === 'support_request') {
      // For support requests, send to support team and confirmation to user
      const supportEmails = Deno.env.get("SUPPORT_EMAILS") || "support@circleapp.com";
      recipientEmail = supportEmails.split(',')[0].trim(); // Primary support email
    }

    if (!recipientEmail) {
      throw new Error("Recipient email is required");
    }

    const template = getEmailTemplate(type, data || {});
    const emailSubject = subject || template.subject;

    // Determine recipients
    const recipients = [recipientEmail];
    
    // For support requests, also send to all support team members
    if (type === 'support_request') {
      const allSupportEmails = Deno.env.get("SUPPORT_EMAILS");
      if (allSupportEmails) {
        const emails = allSupportEmails.split(',').map(email => email.trim());
        recipients.push(...emails.slice(1)); // Add additional support emails
      }
    }
    
    // For billing support, also notify alert emails
    if (type === 'billing_support') {
      const alertEmails = Deno.env.get("ALERT_EMAILS");
      if (alertEmails) {
        recipients.push(...alertEmails.split(',').map(email => email.trim()));
      }
    }

    const emailResponse = await resend.emails.send({
      from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
      to: recipients,
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