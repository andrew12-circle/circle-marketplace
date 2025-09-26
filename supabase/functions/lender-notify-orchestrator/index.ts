import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Email provider interface
interface EmailProvider {
  sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }>;
}

// SMS provider interface  
interface SMSProvider {
  sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string }>;
}

// Simple email provider (would use Resend/SendGrid in production)
class MockEmailProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
    console.log(`📧 Mock Email sent to ${to}: ${subject}`);
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      return { success: false, error: 'Mock email service unavailable' };
    }
    return { success: true };
  }
}

// Simple SMS provider (would use Twilio in production)
class MockSMSProvider implements SMSProvider {
  async sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
    console.log(`📱 Mock SMS sent to ${to}: ${message}`);
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      return { success: false, error: 'Mock SMS service unavailable' };
    }
    return { success: true };
  }
}

// Generate magic link JWT (simplified)
function generateMagicLink(vendorOrgId: string, requestId: string): string {
  const payload = {
    vendor_org_id: vendorOrgId,
    request_id: requestId,
    exp: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
  };
  
  // In production, use proper JWT signing
  const token = btoa(JSON.stringify(payload));
  return `https://app.circlevendor.com/vendor/requests/${requestId}?token=${token}`;
}

async function auditLog(supabase: any, action: string, entity_id: string, meta: any) {
  await supabase.from('lender_audit_log').insert({
    actor: 'system',
    action,
    entity: 'lender_notif_event',
    entity_id,
    meta
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const emailProvider = new MockEmailProvider();
    const smsProvider = new MockSMSProvider();

    // Get pending notifications in batches
    const { data: notifications, error } = await supabase
      .from('lender_notif_event')
      .select(`
        *,
        lender_request(*),
        lender_vendor_org(name),
        lender_vendor_roster(name, email, phone)
      `)
      .eq('status', 'pending')
      .limit(10);

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const notification of notifications || []) {
      try {
        const request = notification.lender_request;
        const vendorOrg = notification.lender_vendor_org;
        const roster = notification.lender_vendor_roster;
        
        const magicLink = generateMagicLink(notification.vendor_org_id, notification.request_id);
        
        let result: { success: boolean; error?: string } = { success: false };

        if (notification.channel === 'email' && roster?.email) {
          const subject = "New Circle request awaiting decision";
          const html = `
            <h2>Action needed: Agent request awaiting your decision</h2>
            <p>Hello ${roster.name || 'there'},</p>
            <p>A new request has been submitted to ${vendorOrg?.name} and requires your review.</p>
            
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>Request Details</h3>
              <p><strong>Agent ID:</strong> ${request.agent_id}</p>
              <p><strong>Requested Share:</strong> ${request.requested_vendor_share}%</p>
              <p><strong>SLA:</strong> Response required within 24 hours</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" 
                 style="background: #007bff; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Review Request
              </a>
            </div>
            
            <p>If the button doesn't work, copy this link: ${magicLink}</p>
            
            <p>Best regards,<br>Circle Team</p>
          `;
          
          result = await emailProvider.sendEmail(roster.email, subject, html);
          
        } else if (notification.channel === 'sms' && roster?.phone) {
          const message = `Circle: New request from Agent ${request.agent_id}. ` +
                         `Share: ${request.requested_vendor_share}%. Review: ${magicLink}`;
          
          result = await smsProvider.sendSMS(roster.phone, message);
        }

        if (result.success) {
          await supabase
            .from('lender_notif_event')
            .update({ status: 'sent' })
            .eq('id', notification.id);

          await auditLog(supabase, 'notify.sent', notification.id, {
            channel: notification.channel,
            recipient: notification.channel === 'email' ? roster?.email : roster?.phone
          });

          sentCount++;
        } else {
          await supabase
            .from('lender_notif_event')
            .update({ 
              status: 'failed',
              error: result.error || 'Unknown error'
            })
            .eq('id', notification.id);

          await auditLog(supabase, 'notify.failed', notification.id, {
            channel: notification.channel,
            error: result.error
          });

          failedCount++;
        }

      } catch (notificationError) {
        console.error(`Failed to process notification ${notification.id}:`, notificationError);
        
        await supabase
          .from('lender_notif_event')
          .update({ 
            status: 'failed',
            error: notificationError.message
          })
          .eq('id', notification.id);

        failedCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: notifications?.length || 0,
      sent: sentCount,
      failed: failedCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Notification orchestrator error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});