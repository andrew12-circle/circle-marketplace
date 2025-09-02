// FILE: src/middleware/security.ts

import { riskScorer } from '@/lib/anti-bot/risk-scorer';
import { rateLimiter } from '@/lib/anti-bot/rate-limiter';
import { securityTelemetry } from '@/lib/anti-bot/telemetry';
import { featureFlags } from '@/lib/anti-bot/feature-flags';

export interface SecurityCheckResult {
  allowed: boolean;
  gateRequired?: 'captcha' | 'pow';
  riskScore?: number;
  reason?: string;
  retryAfter?: number;
}

export interface SecurityMiddlewareOptions {
  rateLimitKey?: string;
  rateLimitMax?: number;
  rateLimitWindow?: number;
  requireActionToken?: boolean;
  bypassForAdmin?: boolean;
}

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  
  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  async checkSecurity(
    request: Request, 
    options: SecurityMiddlewareOptions = {}
  ): Promise<SecurityCheckResult> {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const path = new URL(request.url).pathname;
    
    try {
      // 1. Rate limiting check
      if (options.rateLimitKey) {
        const rateLimitResult = await rateLimiter.checkLimit(
          options.rateLimitKey,
          {
            key: options.rateLimitKey,
            maxRequests: options.rateLimitMax || 10,
            windowMs: (options.rateLimitWindow || 60) * 1000
          }
        );
        
        if (!rateLimitResult.allowed) {
          await securityTelemetry.logEvent({
            type: 'rate_limit_exceeded',
            ip,
            endpoint: path,
            userAgent,
            blocked: true,
            data: { limit: options.rateLimitMax, window: options.rateLimitWindow }
          });
          
          return {
            allowed: false,
            reason: 'Rate limit exceeded',
            retryAfter: rateLimitResult.retryAfter
          };
        }
      }

      // 2. Risk scoring
      const riskResult = await riskScorer.calculateRisk(
        ip,
        undefined, // userId - could be extracted from auth
        userAgent,
        path
      );
      
      const riskScore = riskResult.score;

      // 3. Feature flags check
      const flags = await featureFlags.getFlags();
      
      // Under attack mode
      if (flags.underAttack) {
        if (riskScore >= flags.riskThresholds.medium) {
          return {
            allowed: false,
            gateRequired: 'captcha',
            riskScore,
            reason: 'Under attack mode - verification required'
          };
        }
      }

      // Normal operation gates
      if (riskScore >= flags.riskThresholds.severe) {
        await securityTelemetry.logEvent({
          type: 'high_risk_blocked',
          ip,
          endpoint: path,
          userAgent,
          blocked: true,
          riskScore
        });
        
        return {
          allowed: false,
          reason: 'Risk score too high',
          riskScore
        };
      }

      if (riskScore >= flags.riskThresholds.high && flags.powEnforceHighRisk) {
        return {
          allowed: false,
          gateRequired: 'pow',
          riskScore,
          reason: 'Proof of work required'
        };
      }

      if (riskScore >= flags.riskThresholds.medium || flags.captchaAlwaysOn) {
        return {
          allowed: false,
          gateRequired: 'captcha',
          riskScore,
          reason: 'CAPTCHA verification required'
        };
      }

      // Log successful passage
      await securityTelemetry.logEvent({
        type: 'security_check_passed',
        ip,
        endpoint: path,
        userAgent,
        blocked: false,
        riskScore
      });

      return {
        allowed: true,
        riskScore
      };

    } catch (error) {
      console.error('Security middleware error:', error);
      
      // Fail-open for stability, but log the error
      await securityTelemetry.logEvent({
        type: 'security_middleware_error',
        ip,
        endpoint: path,
        userAgent,
        blocked: false,
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      return { allowed: true };
    }
  }

  private getClientIP(request: Request): string {
    // Check various headers for client IP (Cloudflare, AWS, etc.)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return request.headers.get('x-real-ip') || 
           request.headers.get('cf-connecting-ip') || 
           '127.0.0.1';
  }

  createHeaders(result: SecurityCheckResult): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Add debug headers in non-production
    if (process.env.NODE_ENV !== 'production') {
      if (result.riskScore !== undefined) {
        headers['X-Risk-Score'] = result.riskScore.toString();
      }
      if (result.gateRequired) {
        headers['X-Gate-Required'] = result.gateRequired;
      }
    }
    
    if (result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString();
    }
    
    return headers;
  }
}

export const securityMiddleware = SecurityMiddleware.getInstance();