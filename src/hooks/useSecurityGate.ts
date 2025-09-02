// FILE: src/hooks/useSecurityGate.ts

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type GateType = 'none' | 'captcha' | 'pow' | 'blocked';

interface SecurityGateResult {
  gateType: GateType;
  gateRequired: boolean;
  riskScore?: number;
  workToken?: string;
  error?: string;
}

interface UseSecurityGateOptions {
  endpoint: string;
  userId?: string;
  onBlocked?: () => void;
}

export function useSecurityGate({ endpoint, userId, onBlocked }: UseSecurityGateOptions) {
  const [loading, setLoading] = useState(false);
  const [gateResult, setGateResult] = useState<SecurityGateResult | null>(null);
  const { toast } = useToast();

  const checkSecurityGate = useCallback(async (): Promise<SecurityGateResult> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('security-gate', {
        body: {
          action: 'check',
          endpoint,
          userId,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }
      });

      if (error) {
        throw new Error(error.message || 'Security check failed');
      }

      const result: SecurityGateResult = {
        gateType: data.gateType || 'none',
        gateRequired: data.gateRequired || false,
        riskScore: data.riskScore,
        workToken: data.workToken,
        error: data.error
      };

      setGateResult(result);

      // Handle blocked users
      if (result.gateType === 'blocked') {
        toast({
          title: "Access Restricted",
          description: "Your access has been temporarily restricted due to suspicious activity.",
          variant: "destructive"
        });
        onBlocked?.();
      }

      return result;
    } catch (error) {
      console.error('Security gate check failed:', error);
      const errorResult: SecurityGateResult = {
        gateType: 'none',
        gateRequired: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setGateResult(errorResult);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, [endpoint, userId, onBlocked, toast]);

  const submitWithGate = useCallback(async <T>(
    submitFn: () => Promise<T>,
    options?: { bypassGate?: boolean }
  ): Promise<T> => {
    // Check if we need a security gate
    if (!options?.bypassGate) {
      const gateCheck = await checkSecurityGate();
      
      if (gateCheck.gateType === 'blocked') {
        throw new Error('Access blocked');
      }
      
      if (gateCheck.gateRequired && gateCheck.gateType !== 'none') {
        throw new Error(`Security gate required: ${gateCheck.gateType}`);
      }
    }

    // Check for existing work token
    const workToken = sessionStorage.getItem('workToken');
    const workTokenExpiry = sessionStorage.getItem('workTokenExpiry');
    
    if (workToken && workTokenExpiry && Date.now() < parseInt(workTokenExpiry)) {
      // Use existing work token
      console.log('Using existing work token');
    }

    // Proceed with submission
    return await submitFn();
  }, [checkSecurityGate]);

  const handleCaptchaSuccess = useCallback((token: string) => {
    // Store captcha token for this session
    sessionStorage.setItem('captchaToken', token);
    sessionStorage.setItem('captchaTokenExpiry', (Date.now() + 30 * 60 * 1000).toString());
    
    toast({
      title: "Verification Complete",
      description: "You have successfully completed the security verification.",
    });
    
    setGateResult(prev => prev ? { ...prev, gateType: 'none', gateRequired: false } : null);
  }, [toast]);

  const handlePowSuccess = useCallback((token: string) => {
    // Store work token for this session
    sessionStorage.setItem('workToken', token);
    sessionStorage.setItem('workTokenExpiry', (Date.now() + 30 * 60 * 1000).toString());
    
    toast({
      title: "Challenge Complete",
      description: "You have successfully completed the computational challenge.",
    });
    
    setGateResult(prev => prev ? { ...prev, gateType: 'none', gateRequired: false } : null);
  }, [toast]);

  return {
    loading,
    gateResult,
    checkSecurityGate,
    submitWithGate,
    handleCaptchaSuccess,
    handlePowSuccess
  };
}