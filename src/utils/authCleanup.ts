/**
 * Clear old authentication storage keys to prevent conflicts
 */
export function clearLegacyAuthKeys() {
  try {
    // Remove old supabase auth keys that might conflict
    localStorage.removeItem('sb-session');
    
    // Clear any old supabase keys except our current one
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.') && key !== 'circle-auth-v1') {
        localStorage.removeItem(key);
      }
    });
    
    // Also check sessionStorage for old keys
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-') && key !== 'circle-auth-v1') {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('✅ Legacy auth keys cleared');
  } catch (error) {
    console.warn('Could not clear legacy auth keys:', error);
  }
}

// Clear keys on module load
if (typeof window !== 'undefined') {
  clearLegacyAuthKeys();
}