# Anti-Bot Security System Setup Guide

## Overview

This system provides layered anti-bot protection through:
- **Risk Scoring**: Progressive friction based on behavior analysis
- **Rate Limiting**: Sliding window limits per IP/identifier  
- **CAPTCHA**: Turnstile integration for medium-risk requests
- **Proof-of-Work**: CPU challenges for high-risk requests
- **Action Tokens**: Signed tokens binding actions to page views
- **Feature Flags**: Instant security adjustments via environment variables

## Quick Start

### 1. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env.local

# Update with your actual values
```

### 2. Supabase Setup

The security tables are automatically created via migration. Ensure your Supabase project is connected and migrations have run.

### 3. Turnstile Setup (Optional but Recommended)

1. Get Turnstile keys from [Cloudflare Dashboard](https://dash.cloudflare.com/turnstile)
2. Add to `.env.local`:
   ```
   VITE_TURNSTILE_SITE_KEY=your-site-key
   TURNSTILE_SECRET_KEY=your-secret-key
   ```

### 4. Redis Setup (Production)

For production rate limiting:
1. Create [Upstash Redis](https://console.upstash.com/) database
2. Add credentials to `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

### 5. Add Security Dashboard Route

Add to your router configuration:

```tsx
import SecurityDashboard from '@/pages/SecurityDashboard';

// Add route
{ path: "/admin/security", element: <SecurityDashboard /> }
```

## Integration Examples

### Protect an API Route

```tsx
// pages/api/contact.ts
import { securityMiddleware } from '@/middleware/security';

export default async function handler(req: Request) {
  // Security check
  const securityResult = await securityMiddleware.checkSecurity(req, {
    rateLimitKey: `contact:${getClientIP(req)}`,
    rateLimitMax: 5,
    rateLimitWindow: 300, // 5 minutes
  });

  if (!securityResult.allowed) {
    return new Response(JSON.stringify({ 
      error: securityResult.reason,
      gateRequired: securityResult.gateRequired 
    }), { 
      status: securityResult.gateRequired ? 423 : 429,
      headers: {
        'Content-Type': 'application/json',
        ...securityMiddleware.createHeaders(securityResult)
      }
    });
  }

  // Process request...
  return new Response(JSON.stringify({ success: true }));
}
```

### Protect a Form Component

```tsx
import { SecureActionExample } from '@/components/security/SecureActionExample';

// Use the complete example component that handles all security gates
<SecureActionExample />
```

## Security Levels

### Low Risk (Score < 25)
- Allow immediately
- No additional verification

### Medium Risk (Score 25-49)  
- Require Turnstile CAPTCHA once per session
- Cache success for 30 minutes

### High Risk (Score 50-74)
- Require Proof-of-Work challenge
- 20-bit difficulty (adjustable via `POW_BITS`)
- Work token valid for 30 minutes

### Severe Risk (Score 75+)
- Block request entirely
- Log as potential attack

## Feature Flags

Toggle security features instantly via environment variables:

```bash
# Emergency mode - require CAPTCHA for all requests
UNDER_ATTACK=true

# Always show CAPTCHA (testing)
CAPTCHA_ALWAYS_ON=true

# Disable signups temporarily  
CLOSE_SIGNUPS=true

# Disable PoW for high-risk (use CAPTCHA instead)
POW_ENFORCE_HIGH_RISK=false
```

## Testing

### Simulate Attack Patterns

```bash
# Test rate limiting (should trigger after 10 requests)
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/contact \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@example.com","message":"Test"}' 
done

# Test bot detection (should trigger CAPTCHA/PoW)
curl -X POST http://localhost:3000/api/contact \
  -H "User-Agent: bot/1.0" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test"}'
```

### Monitor Security Events

1. Visit `/admin/security` in your application
2. Watch real-time security events
3. Check risk scores and gate triggers
4. Export audit logs for analysis

### Verify Protection

Success indicators:
- Legitimate users: No CAPTCHA/PoW required
- Bot traffic: Triggers appropriate gates
- High-volume attacks: Rate limited with 429 responses  
- API-only requests: Higher risk scores than normal browsing

## Emergency Procedures

### Under Attack

```bash
# Immediate protection
UNDER_ATTACK=true

# Nuclear option - close signups
CLOSE_SIGNUPS=true  

# Increase PoW difficulty
POW_BITS=24
```

### Roll Back Security

```bash
# Disable all gates
UNDER_ATTACK=false
CAPTCHA_ALWAYS_ON=false
POW_ENFORCE_HIGH_RISK=false

# Reset to permissive mode
RISK_THRESHOLD_MEDIUM=90
RISK_THRESHOLD_HIGH=95
```

### Clear Rate Limits

Access Upstash console or run:
```bash
# Clear all rate limit data
redis-cli FLUSHALL
```

## Monitoring

### Key Metrics

- Rate limit hit rate
- CAPTCHA success rate  
- PoW average solve time
- Risk score distribution
- Top blocked endpoints

### Alerts to Set

- Rate limit exceeded > 100/hour
- PoW solve time > 30 seconds
- Risk score > 80 sustained
- Security middleware errors

### Log Analysis

All security events are logged to:
- `attack_logs` table in Supabase
- Browser console (development)
- Custom telemetry system

## Troubleshooting

### High False Positives

- Lower risk thresholds in `.env`
- Whitelist known good IPs
- Adjust rate limits per endpoint

### Performance Issues

- Check Redis connection
- Monitor PoW difficulty  
- Review rate limit windows

### CAPTCHA Problems

- Verify Turnstile keys
- Check domain configuration
- Test in incognito mode

## Security Considerations

- Never expose secret keys client-side
- Rotate `ACTION_TOKEN_SECRET` regularly  
- Monitor for bypass attempts
- Keep Turnstile keys secure
- Regular security audits recommended

## Support

For issues or questions:
1. Check browser console for client errors
2. Review Supabase Edge Function logs
3. Monitor security dashboard alerts
4. Export audit logs for analysis