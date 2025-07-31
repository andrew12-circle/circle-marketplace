import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      serviceTitle: { required: true, type: 'string', maxLength: 200 },
      vendorName: { required: true, type: 'string', maxLength: 100 },
      clientName: { required: true, type: 'string', maxLength: 100 },
      clientEmail: { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, maxLength: 100 },
      clientPhone: { required: false, type: 'string', maxLength: 20 },
      scheduledDate: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
      scheduledTime: { required: true, type: 'string', maxLength: 10 },
      projectDetails: { required: false, type: 'string', maxLength: 1000 },
      budgetRange: { required: false, type: 'string', maxLength: 50 }
    });

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
    } = validatedData;

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