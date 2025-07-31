import { useState, useCallback } from 'react';

// Input sanitization utilities
export const sanitizeString = (input: string): string => {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[0-9\s\-\(\)\.]+$/;
  return phoneRegex.test(phone);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

// Security validation rules
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  sanitize?: boolean;
  custom?: (value: string) => string | null; // Returns error message or null
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const useSecureInput = (rules: ValidationRules = {}) => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback((name: string, value: string): string | null => {
    const rule = rules[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || value.trim().length === 0)) {
      return `${name} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rule.required) return null;

    // Length validations
    if (rule.minLength && value.length < rule.minLength) {
      return `${name} must be at least ${rule.minLength} characters`;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return `${name} must be no more than ${rule.maxLength} characters`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return `${name} has invalid format`;
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  const sanitizeValue = useCallback((name: string, value: string): string => {
    const rule = rules[name];
    if (rule?.sanitize !== false) {
      return sanitizeString(value);
    }
    return value;
  }, [rules]);

  const validateForm = useCallback((formData: Record<string, string>): boolean => {
    const newErrors: ValidationErrors = {};
    let hasErrors = false;

    Object.entries(formData).forEach(([name, value]) => {
      const error = validateField(name, value);
      if (error) {
        newErrors[name] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [validateField]);

  const sanitizeForm = useCallback((formData: Record<string, string>): Record<string, string> => {
    const sanitized: Record<string, string> = {};
    
    Object.entries(formData).forEach(([name, value]) => {
      sanitized[name] = sanitizeValue(name, value);
    });

    return sanitized;
  }, [sanitizeValue]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    sanitizeForm,
    clearErrors,
    sanitizeString,
    validateEmail,
    validatePhone,
    validateUrl
  };
};

// Password strength validation using database function
export const validatePasswordStrength = async (password: string): Promise<{
  isStrong: boolean;
  score: number;
  maxScore: number;
  feedback: string[];
}> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.rpc('validate_password_strength', { password });
    
    if (error) {
      console.error('Password validation error:', error);
      return {
        isStrong: false,
        score: 0,
        maxScore: 6,
        feedback: ['Unable to validate password strength']
      };
    }
    
    // Type assertion for the database response
    const result = data as {
      is_strong: boolean;
      score: number;
      max_score: number;
      feedback: string[];
    };
    
    return {
      isStrong: result.is_strong,
      score: result.score,
      maxScore: result.max_score,
      feedback: result.feedback
    };
  } catch (error) {
    console.error('Password validation error:', error);
    return {
      isStrong: false,
      score: 0,
      maxScore: 6,
      feedback: ['Unable to validate password strength']
    };
  }
};

// Account lockout check
export const checkAccountLockout = async (email: string): Promise<{
  isLocked: boolean;
  attemptsRemaining: number;
  timeRemainingSeconds: number;
}> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.rpc('check_and_update_lockout', { 
      p_identifier: email,
      p_attempt_type: 'email'
    });
    
    if (error) {
      console.error('Lockout check error:', error);
      return { isLocked: false, attemptsRemaining: 5, timeRemainingSeconds: 0 };
    }
    
    // Type assertion for the database response
    const result = data as {
      is_locked: boolean;
      attempts_remaining: number;
      time_remaining_seconds: number;
    };
    
    return {
      isLocked: result.is_locked,
      attemptsRemaining: result.attempts_remaining,
      timeRemainingSeconds: result.time_remaining_seconds
    };
  } catch (error) {
    console.error('Lockout check error:', error);
    return { isLocked: false, attemptsRemaining: 5, timeRemainingSeconds: 0 };
  }
};

// Clear failed attempts on successful login
export const clearFailedAttempts = async (email: string): Promise<void> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.rpc('clear_failed_attempts', { 
      identifier: email,
      attempt_type: 'email'
    });
  } catch (error) {
    console.error('Clear failed attempts error:', error);
  }
};

// Common validation rule presets
export const commonRules = {
  email: {
    required: true,
    maxLength: 255,
    custom: (value: string) => validateEmail(value) ? null : 'Invalid email format'
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    custom: (value: string) => {
      if (value.length < 8) return 'Password must be at least 8 characters long';
      if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
      if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
      if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
      return null;
    }
  },
  phone: {
    maxLength: 20,
    custom: (value: string) => !value || validatePhone(value) ? null : 'Invalid phone format'
  },
  url: {
    maxLength: 500,
    custom: (value: string) => !value || validateUrl(value) ? null : 'Invalid URL format'
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    sanitize: true
  },
  description: {
    maxLength: 1000,
    sanitize: true
  },
  zipCode: {
    pattern: /^[0-9]{5}(-[0-9]{4})?$/,
    custom: (value: string) => !value || /^[0-9]{5}(-[0-9]{4})?$/.test(value) ? null : 'Invalid ZIP code format'
  }
};