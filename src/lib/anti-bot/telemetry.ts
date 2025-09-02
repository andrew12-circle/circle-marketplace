// FILE: src/lib/anti-bot/telemetry.ts

export interface SecurityEvent {
  type: string;
  ip?: string;
  userId?: string;
  userAgent?: string;
  endpoint?: string;
  data?: Record<string, any>;
  blocked?: boolean;
  riskScore?: number;
}

export interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  riskScoreDistribution: Record<string, number>;
  captchaSuccessRate: number;
  powAvgSolveTime: number;
  topBlockedEndpoints: Array<{ endpoint: string; count: number }>;
}

class SecurityTelemetry {
  private metrics = {
    requests: 0,
    blocked: 0,
    captchaAttempts: 0,
    captchaSuccess: 0,
    powSolveTimes: [] as number[],
    endpointBlocks: new Map<string, number>(),
    riskScores: [] as number[]
  };

  async logEvent(event: SecurityEvent): Promise<void> {
    // Update in-memory metrics
    this.updateMetrics(event);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SECURITY] ${event.type}:`, {
        ip: event.ip,
        endpoint: event.endpoint,
        blocked: event.blocked,
        riskScore: event.riskScore
      });
    }

    try {
      // Log to Supabase in production
      await this.logToSupabase(event);
    } catch (error) {
      console.warn('Failed to log security event:', error);
    }
  }

  private updateMetrics(event: SecurityEvent): void {
    this.metrics.requests++;
    
    if (event.blocked) {
      this.metrics.blocked++;
      
      if (event.endpoint) {
        const current = this.metrics.endpointBlocks.get(event.endpoint) || 0;
        this.metrics.endpointBlocks.set(event.endpoint, current + 1);
      }
    }

    if (event.riskScore !== undefined) {
      this.metrics.riskScores.push(event.riskScore);
      // Keep only last 1000 scores
      if (this.metrics.riskScores.length > 1000) {
        this.metrics.riskScores = this.metrics.riskScores.slice(-1000);
      }
    }

    if (event.type === 'captcha_attempt') {
      this.metrics.captchaAttempts++;
    }

    if (event.type === 'captcha_success') {
      this.metrics.captchaSuccess++;
    }

    if (event.type === 'pow_solved' && event.data?.solveTime) {
      this.metrics.powSolveTimes.push(event.data.solveTime);
      // Keep only last 100 solve times
      if (this.metrics.powSolveTimes.length > 100) {
        this.metrics.powSolveTimes = this.metrics.powSolveTimes.slice(-100);
      }
    }
  }

  private async logToSupabase(event: SecurityEvent): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    await supabase.from('attack_logs').insert({
      attack_type: event.type,
      ip_address: event.ip || '0.0.0.0',
      user_id: event.userId || null,
      endpoint: event.endpoint || null,
      user_agent: event.userAgent || null,
      risk_score: event.riskScore || null,
      blocked: event.blocked || false,
      details: event.data || {}
    });
  }

  getMetrics(): SecurityMetrics {
    const captchaSuccessRate = this.metrics.captchaAttempts > 0 
      ? (this.metrics.captchaSuccess / this.metrics.captchaAttempts) * 100 
      : 0;

    const powAvgSolveTime = this.metrics.powSolveTimes.length > 0
      ? this.metrics.powSolveTimes.reduce((a, b) => a + b, 0) / this.metrics.powSolveTimes.length
      : 0;

    // Risk score distribution
    const riskScoreDistribution: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      severe: 0
    };

    for (const score of this.metrics.riskScores) {
      if (score >= 90) riskScoreDistribution.severe++;
      else if (score >= 75) riskScoreDistribution.high++;
      else if (score >= 50) riskScoreDistribution.medium++;
      else riskScoreDistribution.low++;
    }

    // Top blocked endpoints
    const topBlockedEndpoints = Array.from(this.metrics.endpointBlocks.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests: this.metrics.requests,
      blockedRequests: this.metrics.blocked,
      riskScoreDistribution,
      captchaSuccessRate,
      powAvgSolveTime,
      topBlockedEndpoints
    };
  }

  // Add debug headers for non-production
  getDebugHeaders(riskScore?: number, gateApplied?: string): Record<string, string> {
    if (process.env.NODE_ENV === 'production') {
      return {};
    }

    const headers: Record<string, string> = {};
    
    if (riskScore !== undefined) {
      headers['X-Risk-Score'] = riskScore.toString();
    }
    
    if (gateApplied) {
      headers['X-Gate'] = gateApplied;
    }

    return headers;
  }

  // Clear metrics (for testing)
  clearMetrics(): void {
    this.metrics = {
      requests: 0,
      blocked: 0,
      captchaAttempts: 0,
      captchaSuccess: 0,
      powSolveTimes: [],
      endpointBlocks: new Map(),
      riskScores: []
    };
  }
}

export const securityTelemetry = new SecurityTelemetry();
