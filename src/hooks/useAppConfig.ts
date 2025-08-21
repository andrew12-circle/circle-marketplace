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
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Config doesn't change often
    retry: 1,
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
  const { data: config } = useAppConfig();
  const urlOverride = useFeatureFlag('marketplace', true);
  
  // URL override takes precedence in dev, server config in production
  return urlOverride !== undefined ? urlOverride : config?.marketplace_enabled ?? true;
}

export function useAutoHealEnabled() {
  const { data: config } = useAppConfig();
  return config?.auto_heal_enabled ?? false;
}

export function useSecurityMonitoringGlobal() {
  const { data: config } = useAppConfig();
  return config?.security_monitoring_global ?? false;
}

export function useTopDealsEnabled() {
  const { data: config } = useAppConfig();
  return config?.top_deals_enabled ?? true;
}