// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFeatureFlag } from './useFeatureFlag';

interface AppConfig {
  marketplace_enabled: boolean;
  auto_heal_enabled: boolean;
  security_monitoring_global: boolean;
  top_deals_enabled: boolean;
  maintenance_mode: boolean;
  maintenance_message?: string;
  facilitator_checkout_enabled: boolean;
  min_build_version?: string;
  force_cache_bust_after?: string;
}

export function useAppConfig() {
  return useQuery({
    queryKey: ['app-config'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.warn('Failed to fetch app config:', error);
          return getDefaultConfig();
        }
        
        return data || getDefaultConfig();
      } catch (e) {
        console.warn('App config query failed:', e);
        return getDefaultConfig();
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Config doesn't change often
    retry: 1,
    // Prevent query from throwing during initial render
    throwOnError: false,
    // Use default config while loading
    placeholderData: getDefaultConfig(),
  });
}

function getDefaultConfig(): AppConfig {
  return {
    marketplace_enabled: true,
    auto_heal_enabled: false,
    security_monitoring_global: false,
    top_deals_enabled: true,
    maintenance_mode: false,
    facilitator_checkout_enabled: false,
  };
}

// Convenience hooks for specific flags
export function useMarketplaceEnabled() {
  try {
    const { data: config } = useAppConfig();
    const urlOverride = useFeatureFlag('marketplace', true);
    
    // URL override takes precedence in dev, server config in production
    return urlOverride !== undefined ? urlOverride : config?.marketplace_enabled ?? true;
  } catch (e) {
    console.warn('Failed to check marketplace enabled:', e);
    return true; // Default to enabled
  }
}

export function useAutoHealEnabled() {
  try {
    const { data: config } = useAppConfig();
    return config?.auto_heal_enabled ?? false;
  } catch (e) {
    console.warn('Failed to check auto heal enabled:', e);
    return false;
  }
}

export function useSecurityMonitoringGlobal() {
  try {
    const { data: config } = useAppConfig();
    return config?.security_monitoring_global ?? false;
  } catch (e) {
    console.warn('Failed to check security monitoring:', e);
    return false;
  }
}

export function useTopDealsEnabled() {
  try {
    const { data: config } = useAppConfig();
    return config?.top_deals_enabled ?? true;
  } catch (e) {
    console.warn('Failed to check top deals enabled:', e);
    return true; // Default to enabled
  }
}