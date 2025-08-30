/**
 * Enhanced Supabase client configuration with proper cookie handling
 * Optimized for minimal cookie footprint
 */

// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://ihzyuyfawapweamqzzlj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloenl1eWZhd2Fwd2VhbXF6emxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTA4MTcsImV4cCI6MjA2OTMyNjgxN30.0JJSfqwd1lwI0KB5vcex_xqO-YoTfcaU95HtX9nyl_s";

/**
 * Optimized Supabase client with minimal cookie storage
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Use localStorage for session persistence instead of cookies
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Gracefully handle localStorage errors
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Gracefully handle localStorage errors
        }
      }
    },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Minimize cookie usage
    storageKey: 'sb-session',
    // Ensure secure settings
    cookie: {
      name: 'sb-session',
      options: {
        httpOnly: false, // Must be false for client-side access
        secure: window.location.protocol === 'https:',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});

/**
 * Initialize auth with cookie cleanup
 */
let authInitialized = false;

export function initializeAuth(): void {
  if (authInitialized) {
    console.warn('Auth already initialized, skipping...');
    return;
  }

  authInitialized = true;

  // Clean up legacy cookies on first load
  if (typeof window !== 'undefined') {
    // Import dynamically to avoid issues during SSR
    import('./cookies').then(({ removeLegacyAuthCookies, initCookieMonitoring }) => {
      removeLegacyAuthCookies();
      initCookieMonitoring();
    });
  }
}

/**
 * Get current session with error handling
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Exception getting session:', error);
    return null;
  }
}

/**
 * Sign out with proper cleanup
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
    }
    
    // Clear any remaining auth data
    try {
      localStorage.removeItem('sb-session');
      // Clear other potential keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Ignore localStorage errors during cleanup
    }
    
    return { error };
  } catch (error) {
    console.error('Sign out exception:', error);
    return { error: error as Error };
  }
}

export default supabase;