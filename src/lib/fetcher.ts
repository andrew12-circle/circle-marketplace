/**
 * Enhanced fetch wrapper with cookie recovery for oversized headers
 * Handles 400 errors from cookie size issues gracefully
 */

import { clearAllSupabaseAuthCookies } from './cookies';

interface FetcherOptions extends RequestInit {
  skipRecovery?: boolean;
}

const COOKIE_ERROR_INDICATORS = [
  'Header Fields Too Large',
  'Cookie Too Large', 
  'Request Header Or Cookie Too Large',
  'Bad Request',
  'Request header too large',
  'Cookie header too large'
];

/**
 * Enhanced fetch that handles cookie size recovery
 */
export async function apiFetch(input: RequestInfo | URL, init?: FetcherOptions): Promise<Response> {
  try {
    const response = await fetch(input, init);
    
    // Check for 400 errors that might be cookie-related
    if (response.status === 400 && !init?.skipRecovery) {
      await handlePotentialCookieError(response.clone(), input);
    }
    
    return response;
  } catch (error) {
    // Handle network errors that might be header-related
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.warn('Fetch failed, checking for cookie size issues...');
      await handleFetchError(error, input);
    }
    throw error;
  }
}

/**
 * Handle potential cookie-related 400 errors
 */
async function handlePotentialCookieError(response: Response, input: RequestInfo | URL): Promise<void> {
  try {
    const text = await response.text().catch(() => '');
    const isCookieError = COOKIE_ERROR_INDICATORS.some(indicator => 
      text.toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (isCookieError) {
      console.error('Cookie size error detected:', {
        url: typeof input === 'string' ? input : input.toString(),
        status: response.status,
        error: text.substring(0, 200)
      });
      
      await performCookieRecovery('cookie_error_400');
    }
  } catch (error) {
    console.warn('Failed to check cookie error response:', error);
  }
}

/**
 * Handle fetch errors that might be header-related
 */
async function handleFetchError(error: Error, input: RequestInfo | URL): Promise<void> {
  // Check current cookie size
  const cookieSize = document.cookie.length;
  
  if (cookieSize > 3000) {
    console.error('Large cookies detected during fetch error:', {
      url: typeof input === 'string' ? input : input.toString(),
      cookieSize,
      error: error.message
    });
    
    await performCookieRecovery('fetch_failure_large_cookies');
  }
}

/**
 * Perform cookie recovery and page reload
 */
async function performCookieRecovery(reason: string): Promise<void> {
  try {
    console.log('Performing enhanced cookie recovery:', reason);
    
    // Import cache manager dynamically to avoid circular dependencies
    const { cacheManager } = await import('../utils/cacheManager');
    
    // Report the recovery event
    if (typeof window !== 'undefined' && (window as any).reportClientError) {
      (window as any).reportClientError({
        error_type: 'other',
        message: 'Enhanced cookie recovery performed',
        metadata: { 
          reason,
          cookieSizeBefore: document.cookie.length,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          recoveryType: 'cookie_error_auto_recovery'
        }
      });
    }
    
    // Set reload reason for user feedback
    const reloadReason = reason.includes('cookie_error') ? 'cookie_recovery' : 'self_heal';
    sessionStorage.setItem('last_reload_reason', reloadReason);
    sessionStorage.setItem('recovery_context', JSON.stringify({
      originalReason: reason,
      timestamp: new Date().toISOString(),
      cookieSize: document.cookie.length
    }));
    
    // Clear auth cookies
    clearAllSupabaseAuthCookies();
    
    // Clear application caches to ensure fresh start
    await cacheManager.clearAllCachePreserveSession();
    
    // Clear any problematic localStorage items (but preserve auth session)
    const preserveKeys = ['sb-ihzyuyfawapweamqzzlj-auth-token'];
    const itemsToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !preserveKeys.some(preserve => key.includes(preserve))) {
        // Clear cache-related and potentially problematic items
        if (key.includes('cache') || key.includes('temp') || key.includes('error')) {
          itemsToRemove.push(key);
        }
      }
    }
    
    itemsToRemove.forEach(key => localStorage.removeItem(key));
    
    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Force reload with cache busting
    const url = new URL(window.location.href);
    url.searchParams.set('recovery', Date.now().toString());
    window.location.href = url.toString();
    
  } catch (error) {
    console.error('Enhanced cookie recovery failed:', error);
    
    // Fallback: basic recovery
    try {
      sessionStorage.setItem('last_reload_reason', 'recovery_fallback');
      clearAllSupabaseAuthCookies();
      window.location.reload();
    } catch {
      // Ultimate fallback: redirect to home
      window.location.href = '/';
    }
  }
}

/**
 * Wrapper for standard fetch calls with automatic recovery
 */
export const safeFetch = apiFetch;

/**
 * Fetch wrapper specifically for API routes
 */
export async function apiCall(endpoint: string, options?: FetcherOptions): Promise<Response> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return apiFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });
}

/**
 * JSON API call with automatic error handling
 */
export async function apiJson<T = any>(endpoint: string, options?: FetcherOptions): Promise<T> {
  const response = await apiCall(endpoint, options);
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API call failed: ${response.status} ${errorText}`);
  }
  
  return response.json();
}