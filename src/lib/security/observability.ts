// FILE: src/lib/security/observability.ts

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  path?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

interface SecurityMetricsData {
  unauthorized_attempts: number;
  forbidden_attempts: number;
  rate_limit_hits: number;
  captcha_success: number;
  captcha_failure: number;
  pow_average_solve_time: number;
  webhook_failures: number;
  gated_endpoints: Record<string, number>;
}

/**
 * Structured logger with PII redaction
 */
export class SecureLogger {
  private sensitiveFields = new Set([
    'password', 'token', 'secret', 'key', 'authorization',
    'ssn', 'credit_card', 'phone', 'email', 'address'
  ]);

  /**
   * Log with automatic PII redaction
   */
  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const sanitizedContext = this.redactSensitiveData(context || {});
    
    const logEntry = {
      timestamp,
      level,
      message,
      ...sanitizedContext,
      environment: process.env.NODE_ENV
    };

    // In production, send to proper logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry);
    } else {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, context);
    }
  }

  /**
   * Redact sensitive data from logs
   */
  private redactSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.redactSensitiveData(item));
    }

    const redacted: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      if (this.sensitiveFields.has(lowerKey) || this.containsSensitivePattern(lowerKey)) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'string' && this.looksLikeSensitiveData(value)) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = this.redactSensitiveData(value);
      }
    }

    return redacted;
  }

  /**
   * Check if key contains sensitive patterns
   */
  private containsSensitivePattern(key: string): boolean {
    const patterns = ['pass', 'secret', 'token', 'key', 'auth', 'credential'];
    return patterns.some(pattern => key.includes(pattern));
  }

  /**
   * Check if value looks like sensitive data
   */
  private looksLikeSensitiveData(value: string): boolean {
    // JWT tokens
    if (/^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(value)) {
      return true;
    }
    
    // API keys (common patterns)
    if (/^[a-z0-9]{32,}$/i.test(value) && value.length >= 32) {
      return true;
    }
    
    // Credit card numbers
    if (/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(value)) {
      return true;
    }
    
    return false;
  }

  /**
   * Send logs to external service (implement based on your needs)
   */
  private async sendToLoggingService(logEntry: any): Promise<void> {
    // Implement integration with logging service (DataDog, LogRocket, etc.)
    // For now, just console.log
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Security metrics collector
 */
export class SecurityMetrics {
  private metrics: SecurityMetricsData = {
    unauthorized_attempts: 0,
    forbidden_attempts: 0,
    rate_limit_hits: 0,
    captcha_success: 0,
    captcha_failure: 0,
    pow_average_solve_time: 0,
    webhook_failures: 0,
    gated_endpoints: {}
  };

  private powSolveTimes: number[] = [];

  /**
   * Increment a counter metric
   */
  increment(metric: keyof Omit<SecurityMetricsData, 'pow_average_solve_time' | 'gated_endpoints'>): void {
    if (metric in this.metrics && typeof this.metrics[metric] === 'number') {
      (this.metrics[metric] as number)++;
    }
  }

  /**
   * Record PoW solve time
   */
  recordPowSolveTime(timeMs: number): void {
    this.powSolveTimes.push(timeMs);
    
    // Keep only last 100 solve times
    if (this.powSolveTimes.length > 100) {
      this.powSolveTimes.shift();
    }
    
    // Calculate average
    const sum = this.powSolveTimes.reduce((a, b) => a + b, 0);
    this.metrics.pow_average_solve_time = sum / this.powSolveTimes.length;
  }

  /**
   * Record gated endpoint access
   */
  recordGatedEndpoint(endpoint: string): void {
    this.metrics.gated_endpoints[endpoint] = (this.metrics.gated_endpoints[endpoint] || 0) + 1;
  }

  /**
   * Get current metrics
   */
  getMetrics(): SecurityMetricsData {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      unauthorized_attempts: 0,
      forbidden_attempts: 0,
      rate_limit_hits: 0,
      captcha_success: 0,
      captcha_failure: 0,
      pow_average_solve_time: 0,
      webhook_failures: 0,
      gated_endpoints: {}
    };
    this.powSolveTimes = [];
  }

  /**
   * Export metrics for monitoring systems
   */
  exportPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    let output = '';
    
    // Counter metrics
    output += `security_unauthorized_attempts_total ${metrics.unauthorized_attempts}\n`;
    output += `security_forbidden_attempts_total ${metrics.forbidden_attempts}\n`;
    output += `security_rate_limit_hits_total ${metrics.rate_limit_hits}\n`;
    output += `security_captcha_success_total ${metrics.captcha_success}\n`;
    output += `security_captcha_failure_total ${metrics.captcha_failure}\n`;
    output += `security_webhook_failures_total ${metrics.webhook_failures}\n`;
    
    // Gauge metrics
    output += `security_pow_average_solve_time_ms ${metrics.pow_average_solve_time}\n`;
    
    // Gated endpoints
    for (const [endpoint, count] of Object.entries(metrics.gated_endpoints)) {
      output += `security_gated_endpoint_hits_total{endpoint="${endpoint}"} ${count}\n`;
    }
    
    return output;
  }
}

/**
 * Response headers for debugging (non-production only)
 */
export function getDebugHeaders(riskScore?: number, gateType?: string): Record<string, string> {
  if (process.env.NODE_ENV === 'production') {
    return {};
  }

  const headers: Record<string, string> = {};
  
  if (riskScore !== undefined) {
    headers['X-Risk-Score'] = riskScore.toString();
  }
  
  if (gateType) {
    headers['X-Gate-Required'] = gateType;
  }
  
  headers['X-Security-Debug'] = 'enabled';
  
  return headers;
}

// Singleton instances
export const secureLogger = new SecureLogger();
export const securityMetrics = new SecurityMetrics();
