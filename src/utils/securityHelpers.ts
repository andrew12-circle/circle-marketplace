// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

// Enhanced authentication helper with proper error handling
export const authenticateUser = async (authHeader: string | null) => {
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

// Enhanced admin verification with audit logging
export const verifyAdminAccess = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin, specialties')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Admin verification error:', error);
      throw new Error("Forbidden: Unable to verify admin status");
    }

    const isAdmin = profile?.is_admin || 
                   profile?.specialties?.includes('admin') || 
                   false;

    if (!isAdmin) {
      // Log unauthorized admin access attempt
      await logSecurityEvent('unauthorized_admin_access', userId, {
        attempted_action: 'admin_verification',
        profile_data: { is_admin: profile?.is_admin, specialties: profile?.specialties }
      });
      throw new Error("Forbidden: Admin access required");
    }

    return profile;
  } catch (error) {
    console.error('Admin verification failed:', error);
    throw error;
  }
};

// Security event logging
export const logSecurityEvent = async (
  eventType: string, 
  userId: string | null, 
  eventData: Record<string, any> = {},
  request?: Request
) => {
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
    // Don't throw - logging failures shouldn't break the main operation
  }
};

// Enhanced input validation and sanitization with security features
export const validateAndSanitizeInput = (
  input: any,
  schema: Record<string, {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    maxLength?: number;
    minLength?: number;
    pattern?: RegExp;
    sanitize?: boolean;
    allowedValues?: string[];
  }>
): Record<string, any> => {
  const result: Record<string, any> = {};
  const errors: string[] = [];

  // Check for potential injection attempts
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /vbscript:/i,
    /expression\(/i
  ];

  for (const [key, rules] of Object.entries(schema)) {
    const value = input[key];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`);
      continue;
    }

    // Skip validation for optional empty fields
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`${key} must be of type ${rules.type}`);
        continue;
      }
    }

    // String validations
    if (typeof value === 'string') {
      // Check for dangerous patterns
      const hasDangerousContent = dangerousPatterns.some(pattern => pattern.test(value));
      if (hasDangerousContent) {
        errors.push(`${key} contains potentially dangerous content`);
        continue;
      }

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

      // Check allowed values
      if (rules.allowedValues && !rules.allowedValues.includes(value)) {
        errors.push(`${key} must be one of: ${rules.allowedValues.join(', ')}`);
        continue;
      }

      // Sanitize if required (default to true for security)
      if (rules.sanitize !== false) {
        result[key] = sanitizeString(value);
      } else {
        result[key] = value;
      }
    } else if (Array.isArray(value)) {
      // Validate array contents
      if (rules.type === 'array') {
        result[key] = value.map(item => 
          typeof item === 'string' && rules.sanitize !== false 
            ? sanitizeString(item) 
            : item
        );
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return result;
};

// Enhanced string sanitization with additional security measures
const sanitizeString = (input: string): string => {
  return input
    // Remove script tags and their content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: protocols
    .replace(/javascript:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove data: URLs that could contain scripts
    .replace(/data:[^;]*;base64,/gi, '')
    // Remove vbscript: protocols
    .replace(/vbscript:/gi, '')
    // Remove CSS expressions
    .replace(/expression\s*\(/gi, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim whitespace
    .trim();
};

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000
): boolean => {
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

// CORS headers for edge functions with security headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Standard error response
export const createErrorResponse = (
  message: string, 
  status: number = 400,
  logData?: Record<string, any>
) => {
  if (logData) {
    console.error('Error response:', { message, status, ...logData });
  }
  
  return new Response(
    JSON.stringify({ error: message }), 
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
};

// Standard success response
export const createSuccessResponse = (data: any, status: number = 200) => {
  return new Response(
    JSON.stringify(data), 
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
};