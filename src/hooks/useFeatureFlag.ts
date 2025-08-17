import { useMemo } from 'react';
import { getFeatureFlags, safeStorage } from '@/utils/featureSafety';
import { supabase } from '@/integrations/supabase/client';

interface RemoteFlags {
  [key: string]: boolean;
}

export function useFeatureFlag(flagName: string, defaultValue: boolean = false): boolean {
  return useMemo(() => {
    try {
      // 1. URL override (highest priority)
      const params = new URLSearchParams(window.location.search);
      const urlOverride = params.get(`ff_${flagName}`);
      if (urlOverride === 'on' || urlOverride === 'true') {
        return true;
      }
      if (urlOverride === 'off' || urlOverride === 'false') {
        return false;
      }

      // 2. localStorage flags (via featureSafety)
      const localFlags = getFeatureFlags();
      if (flagName in localFlags) {
        return (localFlags as any)[flagName];
      }

      // 3. Default fallback
      return defaultValue;
    } catch (error) {
      console.warn(`Error reading feature flag ${flagName}:`, error);
      return defaultValue;
    }
  }, [flagName, defaultValue]);
}

// Hook to fetch remote flags (for future use)
export function useRemoteFeatureFlags() {
  return useMemo(async () => {
    try {
      const { data } = await supabase
        .from('app_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      // Parse any feature flag config if we add it later
      return {};
    } catch (error) {
      console.warn('Error fetching remote feature flags:', error);
      return {};
    }
  }, []);
}