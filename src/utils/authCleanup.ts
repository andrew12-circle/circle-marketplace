/**
 * MIGRATION FLAG: One-time cleanup of non-Supabase keys only
 * CRITICAL: Never touch keys that start with "sb-" to avoid auth disruption
 */
export function clearLegacyNonSupabaseKeys() {
  try {
    const migrationKey = 'non_supabase_keys_cleaned_v1';
    
    // Only run once per browser
    if (localStorage.getItem(migrationKey)) {
      return;
    }

    // Only clear non-Supabase keys that are known to be legacy
    const legacyNonSupabaseKeys = [
      'old-app-session',
      'deprecated-user-data',
      'legacy-auth-token'
    ];
    
    legacyNonSupabaseKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Mark as completed
    localStorage.setItem(migrationKey, 'true');
    console.log('🔧 Non-Supabase legacy keys cleaned (one-time migration)');
  } catch (error) {
    console.warn('Could not clean legacy non-Supabase keys:', error);
  }
}

// Remove all legacy auth cleanup on module load since we're stabilizing auth
// clearLegacyAuthKeys(); // REMOVED - no longer auto-clearing auth keys