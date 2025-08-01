import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Circuit breaker configuration
const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5, // Number of failures before opening circuit
  timeout: 30000, // 30 seconds before attempting to close circuit
  resetTimeout: 60000, // 1 minute to fully reset
};

// In-memory circuit breaker state (would use Redis in production)
let circuitState = {
  state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
  failureCount: 0,
  lastFailureTime: 0,
  nextAttempt: 0,
};

// Rate limiting (simple in-memory, would use Redis in production)
const rateLimiter = new Map();
const RATE_LIMIT = {
  windowMs: 60000, // 1 minute
  maxRequests: 100, // Max 100 co-pay notifications per minute
};

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;
  
  if (!rateLimiter.has(identifier)) {
    rateLimiter.set(identifier, []);
  }
  
  const requests = rateLimiter.get(identifier).filter((time: number) => time > windowStart);
  
  if (requests.length >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  requests.push(now);
  rateLimiter.set(identifier, requests);
  return true;
}

function isCircuitOpen(): boolean {
  const now = Date.now();
  
  if (circuitState.state === 'OPEN') {
    if (now >= circuitState.nextAttempt) {
      circuitState.state = 'HALF_OPEN';
      return false;
    }
    return true;
  }
  
  return false;
}

function recordSuccess(): void {
  circuitState.failureCount = 0;
  circuitState.state = 'CLOSED';
}

function recordFailure(): void {
  circuitState.failureCount++;
  circuitState.lastFailureTime = Date.now();
  
  if (circuitState.failureCount >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
    circuitState.state = 'OPEN';
    circuitState.nextAttempt = Date.now() + CIRCUIT_BREAKER_CONFIG.timeout;
  }
}

async function sendNotificationWithRetry(notificationData: any, maxRetries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Simulate notification sending (replace with actual implementation)
      console.log(`Sending co-pay notification (attempt ${attempt}):`, notificationData);
      
      // Add exponential backoff
      if (attempt > 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Simulate successful notification
      await new Promise(resolve => setTimeout(resolve, 100));
      
      recordSuccess();
      return true;
    } catch (error) {
      console.error(`Notification attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        recordFailure();
        return false;
      }
    }
  }
  
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientId = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientId)) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded", 
          message: "Too many co-pay notification requests. Please try again later." 
        }), 
        { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Circuit breaker check
    if (isCircuitOpen()) {
      console.log("Circuit breaker is OPEN - rejecting request");
      return new Response(
        JSON.stringify({ 
          error: "Service temporarily unavailable", 
          message: "Co-pay notification service is experiencing high load. Please try again in a moment." 
        }), 
        { 
          status: 503, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { co_pay_request_id, notification_type, split_percentage } = await req.json();

    if (!co_pay_request_id || !notification_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get co-pay request details
    const { data: coPayRequest, error: fetchError } = await supabase
      .from('co_pay_requests')
      .select(`
        *,
        vendors!co_pay_requests_vendor_id_fkey(name, contact_email),
        profiles!co_pay_requests_agent_id_fkey(display_name)
      `)
      .eq('id', co_pay_request_id)
      .single();

    if (fetchError || !coPayRequest) {
      recordFailure();
      return new Response(
        JSON.stringify({ error: "Co-pay request not found" }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Prepare notification data
    const notificationData = {
      type: notification_type,
      co_pay_request_id,
      vendor_name: coPayRequest.vendors?.name,
      vendor_email: coPayRequest.vendors?.contact_email,
      agent_name: coPayRequest.profiles?.display_name,
      split_percentage,
      created_at: new Date().toISOString(),
    };

    // Insert notification record with background processing
    const { data: notification, error: insertError } = await supabase
      .from('consultation_notifications')
      .insert({
        consultation_booking_id: co_pay_request_id,
        vendor_id: coPayRequest.vendor_id,
        notification_type,
        notification_data: notificationData,
        status: 'pending'
      })
      .select('id')
      .single();

    if (insertError) {
      recordFailure();
      console.error('Failed to insert notification:', insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create notification record" }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Background task to send notification
    const sendNotification = async () => {
      try {
        const success = await sendNotificationWithRetry(notificationData);
        
        // Update notification status
        await supabase
          .from('consultation_notifications')
          .update({
            status: success ? 'sent' : 'failed',
            sent_at: success ? new Date().toISOString() : null,
            error_message: success ? null : 'Failed after retries'
          })
          .eq('id', notification.id);
          
      } catch (error) {
        console.error('Background notification failed:', error);
        await supabase
          .from('consultation_notifications')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', notification.id);
      }
    };

    // Start background task without awaiting
    sendNotification();

    // Return immediate response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Co-pay notification queued successfully",
        notification_id: notification.id,
        circuit_state: circuitState.state
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    recordFailure();
    console.error("Unexpected error in co-pay notification:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: "An unexpected error occurred processing the co-pay notification" 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});