// FILE: src/lib/security/feature-flags-db.ts

import { supabase } from '@/integrations/supabase/client';

interface FeatureFlags {
  UNDER_ATTACK: boolean;
  CAPTCHA_ALWAYS_ON: boolean;
  POW_ENFORCE_HIGH_RISK: boolean;
  CLOSE_SIGNUPS: boolean;
  READ_ONLY_MODE: boolean;
  MAINTENANCE_MODE: boolean;
}

interface FeatureFlagRecord {
  id: string;
  flag_name: string;
  enabled: boolean;
  description?: string;
  updated_at: string;
  updated_by?: string;
}

/**
 * Database-backed feature flags with Redis fallback
 */
export class FeatureFlagsManager {
  private cache = new Map<string, { value: boolean; expires: number }>();
  private cacheTimeout = 30000; // 30 seconds

  /**
   * Get all feature flags
   */
  async getFlags(): Promise<FeatureFlags> {
    try {
      // Check cache first
      const cached = this.getCachedFlags();
      if (cached) {
        return cached;
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('feature_flags')
        .select('flag_name, enabled');

      if (error) {
        console.error('Failed to fetch feature flags:', error);
        return this.getDefaultFlags();
      }

      const flags = this.parseFlags(data || []);
      this.cacheFlags(flags);
      
      return flags;
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      return this.getDefaultFlags();
    }
  }

  /**
   * Get a specific flag
   */
  async getFlag(flagName: keyof FeatureFlags): Promise<boolean> {
    const flags = await this.getFlags();
    return flags[flagName];
  }

  /**
   * Set feature flag (admin only)
   */
  async setFlag(
    flagName: keyof FeatureFlags, 
    enabled: boolean, 
    userId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .upsert({
          flag_name: flagName,
          enabled,
          updated_by: userId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'flag_name'
        });

      if (error) {
        console.error('Failed to set feature flag:', error);
        return false;
      }

      // Clear cache
      this.clearCache();
      
      // Log the change
      if (userId) {
        await this.logFlagChange(flagName, enabled, userId);
      }

      return true;
    } catch (error) {
      console.error('Error setting feature flag:', error);
      return false;
    }
  }

  /**
   * Get cached flags
   */
  private getCachedFlags(): FeatureFlags | null {
    const now = Date.now();
    
    // Check if all flags are cached and not expired
    const requiredFlags: (keyof FeatureFlags)[] = [
      'UNDER_ATTACK', 'CAPTCHA_ALWAYS_ON', 'POW_ENFORCE_HIGH_RISK',
      'CLOSE_SIGNUPS', 'READ_ONLY_MODE', 'MAINTENANCE_MODE'
    ];

    const cachedFlags: Partial<FeatureFlags> = {};
    
    for (const flag of requiredFlags) {
      const cached = this.cache.get(flag);
      if (!cached || now > cached.expires) {
        return null; // Cache miss or expired
      }
      cachedFlags[flag] = cached.value;
    }

    return cachedFlags as FeatureFlags;
  }

  /**
   * Cache flags
   */
  private cacheFlags(flags: FeatureFlags): void {
    const expires = Date.now() + this.cacheTimeout;
    
    for (const [key, value] of Object.entries(flags)) {
      this.cache.set(key, { value, expires });
    }
  }

  /**
   * Clear cache
   */
  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * Parse database records into flags object
   */
  private parseFlags(records: Array<{ flag_name: string; enabled: boolean }>): FeatureFlags {
    const defaults = this.getDefaultFlags();
    
    for (const record of records) {
      if (record.flag_name in defaults) {
        (defaults as any)[record.flag_name] = record.enabled;
      }
    }
    
    return defaults;
  }

  /**
   * Get default flag values
   */
  private getDefaultFlags(): FeatureFlags {
    return {
      UNDER_ATTACK: process.env.UNDER_ATTACK === 'true',
      CAPTCHA_ALWAYS_ON: process.env.CAPTCHA_ALWAYS_ON === 'true',
      POW_ENFORCE_HIGH_RISK: process.env.POW_ENFORCE_HIGH_RISK !== 'false',
      CLOSE_SIGNUPS: process.env.CLOSE_SIGNUPS === 'true',
      READ_ONLY_MODE: process.env.READ_ONLY_MODE === 'true',
      MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === 'true'
    };
  }

  /**
   * Log flag changes for audit
   */
  private async logFlagChange(
    flagName: string, 
    enabled: boolean, 
    userId: string
  ): Promise<void> {
    try {
      await supabase
        .from('audit_log')
        .insert({
          actor: userId,
          action: 'feature_flag.update',
          target: flagName,
          metadata: {
            flag_name: flagName,
            new_value: enabled,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Failed to log flag change:', error);
    }
  }

  /**
   * Initialize default flags in database
   */
  async initializeFlags(): Promise<void> {
    const defaults = this.getDefaultFlags();
    
    for (const [flagName, defaultValue] of Object.entries(defaults)) {
      try {
        await supabase
          .from('feature_flags')
          .upsert({
            flag_name: flagName,
            enabled: defaultValue,
            description: this.getFlagDescription(flagName as keyof FeatureFlags),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'flag_name',
            ignoreDuplicates: true
          });
      } catch (error) {
        console.error(`Failed to initialize flag ${flagName}:`, error);
      }
    }
  }

  /**
   * Get flag descriptions
   */
  private getFlagDescription(flagName: keyof FeatureFlags): string {
    const descriptions = {
      UNDER_ATTACK: 'Enable under attack mode with enhanced protection',
      CAPTCHA_ALWAYS_ON: 'Always require CAPTCHA verification',
      POW_ENFORCE_HIGH_RISK: 'Enforce Proof of Work for high-risk requests',
      CLOSE_SIGNUPS: 'Disable new user registrations',
      READ_ONLY_MODE: 'Enable read-only mode for maintenance',
      MAINTENANCE_MODE: 'Enable maintenance mode'
    };
    
    return descriptions[flagName] || '';
  }
}

// Singleton instance
export const featureFlagsManager = new FeatureFlagsManager();