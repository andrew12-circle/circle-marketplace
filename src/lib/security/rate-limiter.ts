// FILE: src/lib/security/rate-limiter.ts

interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

// In-memory store for development, replace with Redis in production
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a given key
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  
  // Use Redis in production
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return checkRateLimitRedis(key, maxRequests, windowMs);
  }
  
  // Fallback to in-memory for development
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  
  if (current.count >= maxRequests) {
    return { 
      allowed: false, 
      retryAfter: current.resetTime - now 
    };
  }
  
  current.count++;
  return { allowed: true, retryAfter: 0 };
}

/**
 * Redis-based rate limiting for production
 */
async function checkRateLimitRedis(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL!;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN!;
  
  try {
    // Use Redis sliding window
    const pipeline = [
      ['MULTI'],
      ['INCR', key],
      ['EXPIRE', key, Math.ceil(windowMs / 1000)],
      ['EXEC']
    ];
    
    const response = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pipeline)
    });
    
    const results = await response.json();
    const count = results[1]?.result || 0;
    
    if (count > maxRequests) {
      return { 
        allowed: false, 
        retryAfter: windowMs 
      };
    }
    
    return { allowed: true, retryAfter: 0 };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fail open for availability
    return { allowed: true, retryAfter: 0 };
  }
}