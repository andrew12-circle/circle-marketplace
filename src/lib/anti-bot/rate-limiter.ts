// FILE: src/lib/anti-bot/rate-limiter.ts

export interface RateLimit {
  key: string;
  maxRequests: number;
  windowMs: number;
  skipIfSuccessful?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

class RateLimiter {
  private memoryStore = new Map<string, Array<{ timestamp: number; success?: boolean }>>();
  
  async checkLimit(
    identifier: string,
    config: RateLimit
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Try Supabase first, fallback to memory
    try {
      return await this.checkWithSupabase(identifier, config, now, windowStart);
    } catch (error) {
      console.warn('Supabase rate limit check failed, using memory fallback:', error);
      return this.checkWithMemory(identifier, config, now, windowStart);
    }
  }

  async recordRequest(
    identifier: string,
    config: RateLimit,
    success: boolean = true
  ): Promise<void> {
    try {
      await this.recordWithSupabase(identifier, config, success);
    } catch (error) {
      console.warn('Supabase rate limit record failed, using memory fallback:', error);
      this.recordWithMemory(identifier, config, success);
    }
  }

  private async checkWithSupabase(
    identifier: string,
    config: RateLimit,
    now: number,
    windowStart: number
  ): Promise<RateLimitResult> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data } = await supabase
      .from('rate_limit_tracking')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', config.key)
      .gte('last_request', new Date(windowStart).toISOString())
      .order('last_request', { ascending: false });

    let requests = data || [];
    
    // Filter by success if needed
    if (config.skipIfSuccessful) {
      requests = requests.filter(r => !r.success);
    }

    const requestCount = requests.reduce((sum, r) => sum + r.request_count, 0);
    const allowed = requestCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - requestCount);
    
    let retryAfter: number | undefined;
    if (!allowed && requests.length > 0) {
      const oldestRequest = requests[requests.length - 1];
      const oldestTime = new Date(oldestRequest.last_request).getTime();
      retryAfter = Math.ceil((oldestTime + config.windowMs - now) / 1000);
    }

    return {
      allowed,
      remaining,
      resetTime: now + config.windowMs,
      retryAfter
    };
  }

  private async recordWithSupabase(
    identifier: string,
    config: RateLimit,
    success: boolean
  ): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const now = new Date().toISOString();
    const windowStart = new Date(Date.now() - config.windowMs).toISOString();

    // Check if we have an existing record in the current window
    const { data: existing } = await supabase
      .from('rate_limit_tracking')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', config.key)
      .gte('window_start', windowStart)
      .single();

    if (existing) {
      // Update existing record
      await supabase
        .from('rate_limit_tracking')
        .update({
          request_count: existing.request_count + 1,
          last_request: now
        })
        .eq('id', existing.id);
    } else {
      // Create new record
      await supabase
        .from('rate_limit_tracking')
        .insert({
          identifier,
          endpoint: config.key,
          request_count: 1,
          window_start: now,
          last_request: now
        });
    }
  }

  private checkWithMemory(
    identifier: string,
    config: RateLimit,
    now: number,
    windowStart: number
  ): RateLimitResult {
    const key = `${identifier}:${config.key}`;
    const requests = this.memoryStore.get(key) || [];
    
    // Filter to current window
    const recentRequests = requests.filter(r => r.timestamp >= windowStart);
    
    // Filter by success if needed
    const countableRequests = config.skipIfSuccessful 
      ? recentRequests.filter(r => !r.success)
      : recentRequests;

    const allowed = countableRequests.length < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - countableRequests.length);
    
    let retryAfter: number | undefined;
    if (!allowed && countableRequests.length > 0) {
      const oldestRequest = countableRequests[0];
      retryAfter = Math.ceil((oldestRequest.timestamp + config.windowMs - now) / 1000);
    }

    return {
      allowed,
      remaining,
      resetTime: now + config.windowMs,
      retryAfter
    };
  }

  private recordWithMemory(
    identifier: string,
    config: RateLimit,
    success: boolean
  ): void {
    const key = `${identifier}:${config.key}`;
    const requests = this.memoryStore.get(key) || [];
    
    requests.push({ timestamp: Date.now(), success });
    
    // Clean old requests
    const windowStart = Date.now() - config.windowMs;
    const recentRequests = requests.filter(r => r.timestamp >= windowStart);
    
    this.memoryStore.set(key, recentRequests);
  }

  // Common rate limit configurations
  static readonly configs = {
    auth: {
      login: { key: 'auth:login', maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15min
      signup: { key: 'auth:signup', maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
      passwordReset: { key: 'auth:password-reset', maxRequests: 3, windowMs: 60 * 60 * 1000 }
    },
    forms: {
      contact: { key: 'form:contact', maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
      support: { key: 'form:support', maxRequests: 5, windowMs: 60 * 60 * 1000 }
    },
    api: {
      general: { key: 'api:general', maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
      search: { key: 'api:search', maxRequests: 30, windowMs: 60 * 1000 }
    }
  };
}

export const rateLimiter = new RateLimiter();