# Authentication Cookie Guidelines

## Overview

This document outlines our approach to managing Supabase authentication cookies to prevent 400 errors from oversized request headers.

## Problem

Large or duplicate auth cookies can cause:
- 400 Bad Request errors with "Header Fields Too Large"
- Authentication failures requiring users to clear cookies manually
- Poor user experience with intermittent login issues

## Solution Architecture

### 1. Minimal Cookie Storage

- **Primary storage**: localStorage for session data
- **Cookies**: Only minimal session identifier (`sb-session`)
- **Size target**: Under 1KB per cookie
- **Scope**: Limited to `/` path, no subdomain cookies

### 2. Legacy Cookie Cleanup

The system automatically removes old cookie formats on first load:
- `sb-access-token`
- `sb-refresh-token` 
- `supabase-auth-token`
- Project-specific variations

### 3. Cookie Size Monitoring

- Automatic detection of oversized cookies (>3KB)
- Console warnings for debugging
- Error reporting integration

### 4. Graceful Recovery

When 400 errors occur from cookie size issues:
1. Detect error signatures in response
2. Clear only Supabase auth cookies (not all cookies)
3. Reload page for fresh session
4. Log recovery events for monitoring

## Implementation Files

### Core Files

- `src/lib/cookies.ts` - Cookie management utilities
- `src/lib/fetcher.ts` - Enhanced fetch with recovery
- `src/integrations/supabase/client.ts` - Optimized Supabase config
- `src/contexts/AuthContext.tsx` - Single auth state listener

### Key Functions

```typescript
// Clean legacy cookies once per session
removeLegacyAuthCookies()

// Enhanced fetch with automatic recovery
apiFetch(url, options)

// Monitor cookie size
checkCookieSize()

// Emergency cookie cleanup
clearAllSupabaseAuthCookies()
```

## Configuration

### Supabase Client Settings

```typescript
{
  auth: {
    storageKey: 'sb-session',
    cookieOptions: {
      name: 'sb-session',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
      secure: true, // HTTPS only in production
      path: '/'
    }
  }
}
```

### Cookie Recovery Triggers

Recovery activates on 400 responses containing:
- "Header Fields Too Large"
- "Cookie Too Large"
- "Request Header Or Cookie Too Large"
- Network fetch failures with oversized cookies

## Best Practices

### DO
- Use localStorage for large session data
- Set minimal cookie scope (`/` path only)
- Monitor cookie size regularly
- Clean legacy cookies on app updates
- Use single auth state listener

### DON'T
- Store large JWTs in cookies
- Use domain-wide cookies (`.example.com`)
- Set duplicate auth cookies
- Ignore cookie size warnings
- Clear all cookies during recovery

## Monitoring & Alerts

### Error Reporting

The system reports:
- Cookie size warnings (>3KB)
- Recovery events with metadata
- Authentication failures

### Metrics to Track

- `header_oversize_warning` - Cookie size threshold exceeded
- `cookie_prune_recovery` - Recovery mechanism triggered
- Auth session stability and duration

## Testing

### Manual Tests

1. **Normal flow**: Sign in/out, verify single small cookie
2. **Legacy cleanup**: Simulate old cookies, verify removal
3. **Recovery**: Force large cookies, verify automatic recovery
4. **Navigation**: Ensure no duplicate cookie writes

### Automated Checks

- Cookie size stays under 1KB
- No duplicate Set-Cookie headers
- Single auth state listener registration
- Recovery mechanism activates correctly

## Troubleshooting

### Common Issues

**"Header Fields Too Large" errors**
- Check cookie size with `checkCookieSize()`
- Verify legacy cleanup ran
- Force recovery with `clearAllSupabaseAuthCookies()`

**Duplicate cookies**
- Ensure single auth listener
- Check for multiple Supabase client instances
- Verify middleware isn't setting duplicate cookies

**Recovery loop**
- Check error detection logic
- Verify cookie clearing is working
- Review localStorage fallback

### Debug Commands

```javascript
// Check current cookie size
window.checkCookieSize()

// Force legacy cleanup
window.removeLegacyAuthCookies()

// Manual recovery
window.clearAllSupabaseAuthCookies()
```

## Migration Guide

When updating from older auth implementations:

1. **Update Supabase client** with new cookie settings
2. **Add cookie utilities** to project
3. **Update fetch calls** to use `apiFetch` wrapper
4. **Initialize monitoring** in main auth provider
5. **Test recovery flow** thoroughly

This approach ensures robust authentication with minimal cookie overhead and automatic recovery from size-related issues.