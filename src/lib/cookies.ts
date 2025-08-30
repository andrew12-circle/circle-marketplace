/**
 * Cookie management utilities for Supabase auth
 * Handles legacy cookie cleanup and size monitoring
 */

const LEGACY_COOKIE_NAMES = [
  'sb-access-token',
  'sb-refresh-token', 
  'supabase-auth-token',
  'supabase.auth.token',
  'sb-auth-token'
];

const SUPABASE_COOKIE_NAMES = [
  'sb-session',
  'sb-ihzyuyfawapweamqzzlj-auth-token', // Project-specific format
  ...LEGACY_COOKIE_NAMES
];

/**
 * Remove legacy auth cookies that may be causing oversized headers
 * Called once per session to clean up old cookie formats
 */
export function removeLegacyAuthCookies(): void {
  try {
    const sessionKey = 'legacy_cookies_cleaned';
    
    // Only run once per session
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }

    console.log('Cleaning legacy auth cookies...');
    
    LEGACY_COOKIE_NAMES.forEach(name => {
      // Clear from root path
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax`;
      
      // Clear from domain (if set incorrectly)
      const domain = window.location.hostname;
      document.cookie = `${name}=; Path=/; Domain=${domain}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax`;
    });

    sessionStorage.setItem(sessionKey, 'true');
    console.log('Legacy auth cookies cleaned');
  } catch (error) {
    console.warn('Failed to clean legacy cookies:', error);
  }
}

/**
 * Clear all Supabase auth cookies (for recovery scenarios)
 */
export function clearAllSupabaseAuthCookies(): void {
  try {
    console.log('Clearing all Supabase auth cookies...');
    
    SUPABASE_COOKIE_NAMES.forEach(name => {
      // Clear from current path
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax`;
      
      // Clear from domain 
      const domain = window.location.hostname;
      document.cookie = `${name}=; Path=/; Domain=${domain}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax`;
      
      // Clear without secure flag for localhost
      if (window.location.hostname === 'localhost') {
        document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      }
    });

    console.log('All Supabase auth cookies cleared');
  } catch (error) {
    console.warn('Failed to clear auth cookies:', error);
  }
}

/**
 * Get the current size of all cookies
 */
export function getCookieSize(): number {
  try {
    return document.cookie.length;
  } catch {
    return 0;
  }
}

/**
 * Check if cookies are oversized and log warning
 */
export function checkCookieSize(): { oversized: boolean; size: number } {
  const size = getCookieSize();
  const oversized = size > 3000; // 3KB threshold
  
  if (oversized) {
    console.warn('Cookie header oversized:', {
      size,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
    
    // Log to error reporting if available
    if (typeof window !== 'undefined' && (window as any).reportClientError) {
      (window as any).reportClientError({
        error_type: 'other',
        message: 'Cookie header oversized',
        metadata: { size, threshold: 3000 }
      });
    }
  }
  
  return { oversized, size };
}

/**
 * Monitor and log cookie size on navigation
 */
export function initCookieMonitoring(): void {
  try {
    // Check on page load
    checkCookieSize();
    
    // Monitor on navigation (if supported)
    if ('navigation' in window && 'addEventListener' in window.navigation) {
      (window.navigation as any).addEventListener('navigate', () => {
        setTimeout(checkCookieSize, 100);
      });
    }
  } catch (error) {
    console.warn('Failed to initialize cookie monitoring:', error);
  }
}