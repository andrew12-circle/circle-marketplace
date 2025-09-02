import { supabase } from '@/integrations/supabase/client';

let cachedUserId: string | null | undefined;

export async function getAuthUserId(): Promise<string | null> {
  if (cachedUserId !== undefined) return cachedUserId ?? null;
  
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('Failed to get user:', error.message);
      cachedUserId = null;
      return null;
    }
    cachedUserId = data?.user?.id ?? null;
    return cachedUserId;
  } catch (error) {
    console.warn('Exception getting user:', error);
    cachedUserId = null;
    return null;
  }
}

export async function waitForSession(timeoutMs = 5000): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const uid = await getAuthUserId();
    if (uid) return uid;
    await new Promise(r => setTimeout(r, 150));
  }
  return null;
}

// Clear cache when auth state changes
export function clearAuthCache() {
  cachedUserId = undefined;
}

// Set up auth state listener to clear cache
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    clearAuthCache();
  }
});