// FILE: src/lib/security/payments-security.ts

import { supabase } from '@/integrations/supabase/client';
import { auditLogger } from './audit-log';
import { secureLogger } from './observability';
import { circuitBreakers } from './circuit-breaker';

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
}

interface PaymentAttempt {
  userId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

/**
 * Secure payment processing with fraud detection
 */
export class PaymentSecurity {
  private attemptCache = new Map<string, PaymentAttempt[]>();
  private suspiciousPatterns = [
    /test.*card/i,
    /fake.*payment/i,
    /fraud.*test/i
  ];

  /**
   * Create secure payment intent with fraud checks
   */
  async createSecurePaymentIntent(
    amount: number,
    currency: string = 'usd',
    userId?: string,
    metadata: Record<string, any> = {}
  ): Promise<{ paymentIntent?: PaymentIntent; blocked?: boolean; reason?: string }> {
    try {
      // Pre-payment fraud checks
      const fraudCheck = await this.performFraudChecks({
        userId,
        amount,
        currency,
        metadata
      });

      if (fraudCheck.blocked) {
        await auditLogger.logPayment('fraud_blocked', userId, {
          amount,
          currency,
          reason: fraudCheck.reason,
          risk_score: fraudCheck.riskScore
        });

        return {
          blocked: true,
          reason: fraudCheck.reason
        };
      }

      // Use circuit breaker for Stripe API calls
      const paymentIntent = await circuitBreakers.execute('stripe', async () => {
        return this.callStripeAPI('/payment_intents', {
          amount,
          currency,
          customer: metadata.customerId,
          metadata: {
            ...metadata,
            user_id: userId,
            created_via: 'secure_payment_api'
          }
        });
      });

      // Log successful creation
      await auditLogger.logPayment('payment_intent_created', userId, {
        payment_intent_id: paymentIntent.id,
        amount,
        currency
      });

      return { paymentIntent };

    } catch (error) {
      secureLogger.error('Payment intent creation failed', {
        userId,
        amount,
        currency,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error('Payment processing temporarily unavailable');
    }
  }

  /**
   * Verify payment with enhanced security
   */
  async verifyPayment(
    paymentIntentId: string,
    expectedAmount: number,
    userId?: string
  ): Promise<{ verified: boolean; payment?: any }> {
    try {
      const payment = await circuitBreakers.execute('stripe', async () => {
        return this.callStripeAPI(`/payment_intents/${paymentIntentId}`);
      });

      // Verify payment details
      const verified = 
        payment.status === 'succeeded' &&
        payment.amount === expectedAmount &&
        (payment.metadata?.user_id === userId || !userId);

      if (verified) {
        await auditLogger.logPayment('payment_verified', userId, {
          payment_intent_id: paymentIntentId,
          amount: payment.amount,
          currency: payment.currency
        });
      } else {
        await auditLogger.logPayment('payment_verification_failed', userId, {
          payment_intent_id: paymentIntentId,
          expected_amount: expectedAmount,
          actual_amount: payment.amount,
          status: payment.status
        });
      }

      return { verified, payment: verified ? payment : undefined };

    } catch (error) {
      secureLogger.error('Payment verification failed', {
        paymentIntentId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return { verified: false };
    }
  }

  /**
   * Perform fraud detection checks
   */
  private async performFraudChecks(params: {
    userId?: string;
    amount: number;
    currency: string;
    metadata: Record<string, any>;
  }): Promise<{ blocked: boolean; reason?: string; riskScore: number }> {
    let riskScore = 0;
    const reasons: string[] = [];

    // Check amount thresholds
    if (params.amount > 100000) { // $1000+
      riskScore += 30;
      reasons.push('High amount transaction');
    }

    // Check for suspicious metadata
    const metadataStr = JSON.stringify(params.metadata).toLowerCase();
    if (this.suspiciousPatterns.some(pattern => pattern.test(metadataStr))) {
      riskScore += 50;
      reasons.push('Suspicious transaction metadata');
    }

    // Check user payment history
    if (params.userId) {
      const recentPayments = await this.getRecentPaymentAttempts(params.userId);
      
      // Multiple payments in short time
      if (recentPayments.length > 5) {
        riskScore += 40;
        reasons.push('Multiple recent payment attempts');
      }

      // Velocity check - too many payments too quickly
      const last5Minutes = recentPayments.filter(
        p => Date.now() - p.timestamp.getTime() < 5 * 60 * 1000
      );
      
      if (last5Minutes.length > 2) {
        riskScore += 60;
        reasons.push('High payment velocity');
      }
    }

    // Check for round numbers (common in fraud)
    if (params.amount > 0 && params.amount % 10000 === 0) {
      riskScore += 20;
      reasons.push('Round number amount');
    }

    const blocked = riskScore >= 80;

    return {
      blocked,
      reason: blocked ? reasons.join(', ') : undefined,
      riskScore
    };
  }

  /**
   * Get recent payment attempts for user
   */
  private async getRecentPaymentAttempts(userId: string): Promise<PaymentAttempt[]> {
    const cacheKey = `payment_attempts_${userId}`;
    const cached = this.attemptCache.get(cacheKey);
    
    if (cached) {
      // Filter out old attempts (older than 1 hour)
      const recent = cached.filter(
        attempt => Date.now() - attempt.timestamp.getTime() < 60 * 60 * 1000
      );
      
      this.attemptCache.set(cacheKey, recent);
      return recent;
    }

    // In production, query from database
    try {
      const { data } = await supabase
        .from('payment_attempts')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      const attempts = (data || []).map(row => ({
        userId: row.user_id,
        amount: row.amount,
        currency: row.currency,
        paymentMethod: row.payment_method,
        ip: row.ip_address,
        userAgent: row.user_agent,
        timestamp: new Date(row.created_at)
      }));

      this.attemptCache.set(cacheKey, attempts);
      return attempts;

    } catch (error) {
      secureLogger.error('Failed to fetch payment attempts', { userId, error });
      return [];
    }
  }

  /**
   * Record payment attempt
   */
  async recordPaymentAttempt(attempt: PaymentAttempt): Promise<void> {
    try {
      // Store in database
      await supabase
        .from('payment_attempts')
        .insert({
          user_id: attempt.userId,
          amount: attempt.amount,
          currency: attempt.currency,
          payment_method: attempt.paymentMethod,
          ip_address: attempt.ip,
          user_agent: attempt.userAgent
        });

      // Update cache
      if (attempt.userId) {
        const cacheKey = `payment_attempts_${attempt.userId}`;
        const existing = this.attemptCache.get(cacheKey) || [];
        existing.push(attempt);
        this.attemptCache.set(cacheKey, existing);
      }

    } catch (error) {
      secureLogger.error('Failed to record payment attempt', { attempt, error });
    }
  }

  /**
   * Apply adaptive friction based on risk score
   */
  getAdaptiveFriction(riskScore: number, declineCount: number = 0): {
    requireStepUp: boolean;
    requireCaptcha: boolean;
    cooldownPeriod?: number;
  } {
    const baseRisk = riskScore + (declineCount * 20);

    return {
      requireStepUp: baseRisk >= 60,
      requireCaptcha: baseRisk >= 40,
      cooldownPeriod: baseRisk >= 80 ? 300000 : undefined // 5 minutes
    };
  }

  /**
   * Idempotency key generation for payments
   */
  generateIdempotencyKey(userId?: string, amount?: number): string {
    const timestamp = Math.floor(Date.now() / 1000); // Round to second
    const userPart = userId ? userId.slice(-8) : 'anon';
    const amountPart = amount ? amount.toString() : 'na';
    
    return `pay_${userPart}_${amountPart}_${timestamp}`;
  }

  /**
   * Mock Stripe API call (replace with actual Stripe integration)
   */
  private async callStripeAPI(endpoint: string, data?: any): Promise<any> {
    // This is a mock implementation
    // In production, use the actual Stripe SDK
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
    
    if (endpoint.includes('payment_intents') && data) {
      return {
        id: `pi_${Math.random().toString(36).substr(2, 9)}`,
        amount: data.amount,
        currency: data.currency,
        status: 'requires_payment_method',
        client_secret: `pi_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
        metadata: data.metadata
      };
    }
    
    if (endpoint.includes('payment_intents/pi_')) {
      return {
        id: endpoint.split('/').pop(),
        amount: 1000,
        currency: 'usd',
        status: 'succeeded',
        metadata: { user_id: 'test' }
      };
    }
    
    throw new Error('Stripe API endpoint not found');
  }
}

// Singleton instance
export const paymentSecurity = new PaymentSecurity();