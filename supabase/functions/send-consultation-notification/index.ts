
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const resendApiKey = Deno.env.get('RESEND_API_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables');
}

if (!resendApiKey) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Enhanced security helpers for edge functions
const authenticateUser = async (authHeader: string | null) => {
  if (!authHeader) {
    throw new Error("Unauthorized: No authorization header provided");
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token || token.length < 10) {
    throw new Error("Unauthorized: Invalid authorization token");
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Authentication error:', error.message);
      throw new Error("Unauthorized: Invalid token");
    }
    
    if (!user) {
      throw new Error("Unauthorized: User not found");
    }

    return user;
  } catch (error) {
    console.error('User authentication failed:', error);
    throw new Error("Unauthorized: Authentication failed");
  }
};

// Rate limiting function
const checkRateLimit = (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
};

const sanitizeString = (input: string): string => {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

const validateInput = (input: any, schema: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  const errors: string[] = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = input[key];

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`);
      continue;
    }

    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`${key} must be of type ${rules.type}`);
        continue;
      }
    }

    if (typeof value === 'string') {
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${key} must be no more than ${rules.maxLength} characters`);
        continue;
      }
      
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${key} must be at least ${rules.minLength} characters`);
        continue;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${key} has invalid format`);
        continue;
      }

      result[key] = rules.sanitize !== false ? sanitizeString(value) : value;
    } else {
      result[key] = value;
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return result;
};

const logSecurityEvent = async (eventType: string, userId: string | null, eventData: Record<string, any> = {}, request?: Request) => {
  try {
    const clientIP = request?.headers.get('x-forwarded-for') || 
                    request?.headers.get('x-real-ip') || 
                    'unknown';
    
    const userAgent = request?.headers.get('user-agent') || 'unknown';

    await supabase
      .from('security_events')
      .insert({
        event_type: eventType,
        user_id: userId,
        event_data: eventData,
        ip_address: clientIP,
        user_agent: userAgent
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

interface ConsultationRequest {
  bookingId: string;
  serviceId?: string;
  serviceTitle: string;
  vendorName: string;
  vendorId?: string;
  vendorEmail?: string;
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
    // Rate limiting
    const rateLimitKey = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(rateLimitKey, 5, 60000)) { // 5 requests per minute
      await logSecurityEvent('rate_limit_exceeded', null, { endpoint: 'send-consultation-notification' }, req);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    const user = await authenticateUser(authHeader);
    
    // Parse and validate input
    const requestBody = await req.json();
    const validatedData = validateInput(requestBody, {
      bookingId: { required: true, type: 'string', maxLength: 100 },
      serviceId: { required: false, type: 'string', maxLength: 100 },
      serviceTitle: { required: true, type: 'string', maxLength: 200 },
      vendorName: { required: true, type: 'string', maxLength: 100 },
      vendorId: { required: false, type: 'string', maxLength: 100 },
      vendorEmail: { required: false, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, maxLength: 100 },
      clientName: { required: true, type: 'string', maxLength: 100 },
      clientEmail: { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, maxLength: 100 },
      clientPhone: { required: false, type: 'string', maxLength: 20 },
      scheduledDate: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
      scheduledTime: { required: true, type: 'string', maxLength: 20 },
      projectDetails: { required: false, type: 'string', maxLength: 1000 },
      budgetRange: { required: false, type: 'string', maxLength: 50 }
    });

    const { 
      bookingId, 
      serviceId,
      serviceTitle, 
      vendorName, 
      vendorId,
      vendorEmail: providedVendorEmail,
      clientName, 
      clientEmail,
      clientPhone,
      scheduledDate,
      scheduledTime,
      projectDetails,
      budgetRange 
    } = validatedData;

    console.log('Processing consultation notification for:', { bookingId, vendorName, serviceTitle });

    // Get service consultation emails (new multi-recipient system)
    let notificationEmails: string[] = [];
    let notificationStrategy = 'internal_team';

    if (serviceId) {
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('consultation_emails, consultation_email')
        .eq('id', serviceId)
        .single();

      if (!serviceError && serviceData) {
        // Priority 1: Use new consultation_emails array (up to 4 emails)
        if (serviceData.consultation_emails && serviceData.consultation_emails.length > 0) {
          notificationEmails = serviceData.consultation_emails;
          notificationStrategy = 'service_emails_array';
          console.log(`Found ${notificationEmails.length} service consultation emails:`, notificationEmails);
        }
        // Priority 2: Fallback to single consultation_email
        else if (serviceData.consultation_email) {
          notificationEmails = [serviceData.consultation_email];
          notificationStrategy = 'service_single_email';
          console.log(`Found single service consultation email: ${serviceData.consultation_email}`);
        }
      }
    }

    // Priority 3: Fallback to vendor email if no service emails
    if (notificationEmails.length === 0) {
      if (providedVendorEmail) {
        notificationEmails = [providedVendorEmail];
        notificationStrategy = 'vendor_email';
      } else if (vendorId) {
        // Lookup vendor email
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .select('contact_email, individual_email')
          .eq('id', vendorId)
          .single();

        if (!vendorError && vendor) {
          const vendorEmail = vendor.individual_email || vendor.contact_email;
          if (vendorEmail) {
            notificationEmails = [vendorEmail];
            notificationStrategy = 'vendor_lookup_email';
          }
        }
      } else {
        // Lookup vendor by name
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .select('contact_email, individual_email')
          .eq('name', vendorName)
          .single();

        if (!vendorError && vendor) {
          const vendorEmail = vendor.individual_email || vendor.contact_email;
          if (vendorEmail) {
            notificationEmails = [vendorEmail];
            notificationStrategy = 'vendor_name_lookup';
          }
        }
      }
    }

    console.log(`Using notification strategy: ${notificationStrategy}, Emails: ${notificationEmails.length > 0 ? notificationEmails.join(', ') : 'internal team'}`);

    // Create notification record
    const { error: notificationError } = await supabase
      .from('consultation_notifications')
      .insert({
        consultation_booking_id: bookingId,
        vendor_id: vendorId || null,
        notification_type: notificationStrategy,
        status: 'pending',
        notification_data: {
          target_emails: notificationEmails,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          service_title: serviceTitle,
          vendor_name: vendorName,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          project_details: projectDetails,
          budget_range: budgetRange,
          notification_strategy: notificationStrategy
        }
      });

    if (notificationError) {
      console.error('Error creating notification record:', notificationError);
      throw notificationError;
    }

    // Send notifications
    let emailsSent = 0;
    const emailResults = [];

    if (notificationEmails.length > 0) {
      // Send emails to service/vendor recipients
      const subject = `🔥 URGENT: New Consultation Booking - ${serviceTitle}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
          <div style="background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #e74c3c; font-size: 28px; margin: 0;">🔥 URGENT BOOKING ALERT</h1>
              <p style="color: #7f8c8d; font-size: 16px; margin: 10px 0 0 0;">You have a new consultation request!</p>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <h2 style="color: #856404; margin: 0 0 10px 0;">⚡ ACTION REQUIRED</h2>
              <p style="color: #856404; margin: 0; font-weight: bold;">Please contact this client immediately to confirm the consultation.</p>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin: 0 0 15px 0; border-bottom: 2px solid #3498db; padding-bottom: 8px;">📋 Consultation Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #2c3e50; border-bottom: 1px solid #ecf0f1;">Service:</td>
                  <td style="padding: 8px 12px; color: #34495e; border-bottom: 1px solid #ecf0f1;">${serviceTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #2c3e50; border-bottom: 1px solid #ecf0f1;">Date & Time:</td>
                  <td style="padding: 8px 12px; color: #34495e; border-bottom: 1px solid #ecf0f1;">${scheduledDate} at ${scheduledTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #2c3e50; border-bottom: 1px solid #ecf0f1;">Client:</td>
                  <td style="padding: 8px 12px; color: #34495e; border-bottom: 1px solid #ecf0f1;">${clientName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #2c3e50; border-bottom: 1px solid #ecf0f1;">Email:</td>
                  <td style="padding: 8px 12px; color: #34495e; border-bottom: 1px solid #ecf0f1;"><a href="mailto:${clientEmail}" style="color: #3498db;">${clientEmail}</a></td>
                </tr>
                ${clientPhone ? `
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #2c3e50; border-bottom: 1px solid #ecf0f1;">Phone:</td>
                  <td style="padding: 8px 12px; color: #34495e; border-bottom: 1px solid #ecf0f1;"><a href="tel:${clientPhone}" style="color: #3498db;">${clientPhone}</a></td>
                </tr>
                ` : ''}
                ${budgetRange ? `
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #2c3e50; border-bottom: 1px solid #ecf0f1;">Budget Range:</td>
                  <td style="padding: 8px 12px; color: #34495e; border-bottom: 1px solid #ecf0f1;">${budgetRange}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${projectDetails ? `
            <div style="background: #e8f4f8; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin: 0 0 10px 0;">📝 Project Details</h3>
              <p style="color: #34495e; margin: 0; line-height: 1.6;">${projectDetails}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #e74c3c; color: white; padding: 15px; border-radius: 6px; margin: 10px 0;">
                <h3 style="margin: 0 0 10px 0;">⏰ IMMEDIATE ACTION REQUIRED</h3>
                <p style="margin: 0; font-size: 16px;">Contact this client within the next 2 hours to secure this booking!</p>
              </div>
              <p style="margin: 20px 0 0 0; color: #7f8c8d; font-size: 14px;">
                Booking ID: ${bookingId}<br>
                Sent via Circle Network Consultation System
              </p>
            </div>
          </div>
        </div>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "Circle Network Bookings <bookings@circlenetwork.io>",
          to: notificationEmails,
          subject: subject,
          html: html,
        });

        emailsSent = notificationEmails.length;
        emailResults.push(`Successfully sent to: ${notificationEmails.join(', ')}`);
        console.log('✅ Emails sent successfully:', emailResponse);
      } catch (emailError) {
        console.error('❌ Error sending emails:', emailError);
        emailResults.push(`Failed to send emails: ${emailError.message}`);
      }
    } else {
      // Send notification to internal team
      console.log(`🏢 SENDING INTERNAL TEAM NOTIFICATION`);
      const internalSubject = `URGENT: Manual Vendor Contact Needed - ${serviceTitle}`;
      const internalHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
          <div style="background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #e74c3c;">🚨 URGENT: Manual Vendor Contact Required</h1>
            <p style="font-size: 18px; color: #2c3e50;">A consultation booking requires immediate manual outreach to the vendor.</p>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <h3 style="color: #856404; margin: 0;">⚡ ACTION REQUIRED</h3>
              <p style="color: #856404; margin: 5px 0 0 0; font-weight: bold;">Contact vendor immediately to arrange consultation</p>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px;">
              <h3 style="color: #2c3e50;">Details:</h3>
              <p><strong>VENDOR:</strong> ${vendorName}</p>
              <p><strong>SERVICE:</strong> ${serviceTitle}</p>
              <p><strong>CLIENT:</strong> ${clientName} (${clientEmail})</p>
              ${clientPhone ? `<p><strong>CLIENT PHONE:</strong> ${clientPhone}</p>` : ''}
              <p><strong>SCHEDULED:</strong> ${scheduledDate} at ${scheduledTime}</p>
              ${projectDetails ? `<p><strong>PROJECT DETAILS:</strong> ${projectDetails}</p>` : ''}
              ${budgetRange ? `<p><strong>BUDGET RANGE:</strong> ${budgetRange}</p>` : ''}
              <p><strong>Booking ID:</strong> ${bookingId}</p>
            </div>
          </div>
        </div>
      `;

      try {
        await resend.emails.send({
          from: "Circle Network System <system@circlenetwork.io>",
          to: ["support@circlenetwork.io"], // Replace with your internal team email
          subject: internalSubject,
          html: internalHtml,
        });
        
        emailsSent = 1;
        emailResults.push('Internal team notified');
        console.log('✅ Internal team notification sent');
      } catch (emailError) {
        console.error('❌ Error sending internal notification:', emailError);
        emailResults.push(`Failed to send internal notification: ${emailError.message}`);
      }
    }

    // Update notification status
    await supabase
      .from('consultation_notifications')
      .update({ 
        status: emailsSent > 0 ? 'sent' : 'failed', 
        sent_at: new Date().toISOString(),
        error_message: emailsSent === 0 ? emailResults.join('; ') : null
      })
      .eq('consultation_booking_id', bookingId);

    console.log(`✅ Notification process complete. Emails sent: ${emailsSent}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        notification_strategy: notificationStrategy,
        emails_sent: emailsSent,
        recipients: notificationEmails.length > 0 ? notificationEmails : ['internal_team'],
        results: emailResults
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
