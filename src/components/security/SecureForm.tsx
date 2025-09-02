// FILE: src/components/security/SecureForm.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HoneypotField } from './HoneypotField';
import { actionTokens } from '@/lib/anti-bot/action-tokens';
import { rateLimiter } from '@/lib/anti-bot/rate-limiter';
import { AlertCircle, Shield } from 'lucide-react';

interface SecureFormProps {
  children: React.ReactNode;
  onSubmit: (data: FormData, actionToken: string) => Promise<void>;
  actionRoute: string;
  rateLimitKey?: string;
  minSubmissionTime?: number;
  requireActionToken?: boolean;
  className?: string;
}

export function SecureForm({
  children,
  onSubmit,
  actionRoute,
  rateLimitKey,
  minSubmissionTime = 2000,
  requireActionToken = true,
  className = ''
}: SecureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionToken, setActionToken] = useState<string | null>(null);
  const [formStartTime] = useState(Date.now());
  const [honeypotValue, setHoneypotValue] = useState('');

  // Generate action token on mount
  useEffect(() => {
    if (requireActionToken) {
      const generateToken = async () => {
        try {
          const token = await actionTokens.generateToken(actionRoute);
          setActionToken(token);
        } catch (error) {
          console.error('Failed to generate action token:', error);
          setError('Failed to initialize secure form');
        }
      };
      generateToken();
    }
  }, [actionRoute, requireActionToken]);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Honeypot check
    if (honeypotValue) {
      setError('Security validation failed');
      return;
    }

    // Timing check
    if (!actionTokens.validateSubmissionTiming(formStartTime, minSubmissionTime)) {
      setError('Please take more time to fill out the form');
      return;
    }

    // Rate limiting check
    if (rateLimitKey) {
      try {
        const identifier = `${window.location.hostname}-${Date.now()}`;
        const result = await rateLimiter.checkLimit(identifier, {
          key: rateLimitKey,
          maxRequests: 5,
          windowMs: 60 * 60 * 1000 // 1 hour
        });

        if (!result.allowed) {
          setError(`Rate limit exceeded. Please try again in ${Math.ceil((result.retryAfter || 60) / 60)} minutes.`);
          return;
        }
      } catch (error) {
        console.warn('Rate limit check failed:', error);
      }
    }

    // Action token validation
    if (requireActionToken && !actionToken) {
      setError('Security token missing. Please refresh the page.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      await onSubmit(formData, actionToken || '');
      
      // Record successful submission for rate limiting
      if (rateLimitKey) {
        const identifier = `${window.location.hostname}-${Date.now()}`;
        await rateLimiter.recordRequest(identifier, {
          key: rateLimitKey,
          maxRequests: 5,
          windowMs: 60 * 60 * 1000
        }, true);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setError(error instanceof Error ? error.message : 'Submission failed');
      
      // Record failed submission for rate limiting
      if (rateLimitKey) {
        const identifier = `${window.location.hostname}-${Date.now()}`;
        await rateLimiter.recordRequest(identifier, {
          key: rateLimitKey,
          maxRequests: 5,
          windowMs: 60 * 60 * 1000
        }, false);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, actionToken, honeypotValue, formStartTime, minSubmissionTime, rateLimitKey, requireActionToken, actionRoute]);

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {/* Action token (hidden) */}
      {actionToken && (
        <input
          type="hidden"
          name="actionToken"
          value={actionToken}
        />
      )}

      {/* Honeypot field */}
      <HoneypotField onValueChange={setHoneypotValue} />

      {/* Form start time (hidden) */}
      <input
        type="hidden"
        name="formStartTime"
        value={formStartTime}
      />

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form content */}
      {children}

      {/* Security indicator */}
      {requireActionToken && (
        <div className="flex items-center justify-center text-xs text-muted-foreground pt-2">
          <Shield className="h-3 w-3 mr-1" />
          <span>Protected by security validation</span>
        </div>
      )}
    </form>
  );
}