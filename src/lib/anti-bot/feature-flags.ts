// FILE: src/lib/anti-bot/feature-flags.ts

export interface SecurityFlags {
  underAttack: boolean;
  captchaAlwaysOn: boolean;
  powEnforceHighRisk: boolean;
  closeSignups: boolean;
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
    severe: number;
  };
  powDifficulty: {
    bits: number;
  };
}

class FeatureFlags {
  private flags: SecurityFlags | null = null;
  private lastFetch = 0;
  private cacheTTL = 30000; // 30 seconds

  async getFlags(): Promise<SecurityFlags> {
    const now = Date.now();
    if (this.flags && (now - this.lastFetch) < this.cacheTTL) {
      return this.flags;
    }

    // Default flags
    const defaults: SecurityFlags = {
      underAttack: false,
      captchaAlwaysOn: false,
      powEnforceHighRisk: true,
      closeSignups: false,
      riskThresholds: { low: 25, medium: 50, high: 75, severe: 90 },
      powDifficulty: { bits: 20 }
    };

    try {
      // Try to fetch from environment first
      const envFlags = this.getEnvFlags();
      if (envFlags) {
        this.flags = { ...defaults, ...envFlags };
        this.lastFetch = now;
        return this.flags;
      }

      // Fallback to database (for server-side)
      if (typeof window === 'undefined') {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data } = await supabase
          .from('security_config')
          .select('config_key, config_value');

        if (data) {
          const dbFlags = this.parseDbFlags(data);
          this.flags = { ...defaults, ...dbFlags };
          this.lastFetch = now;
          return this.flags;
        }
      }

      this.flags = defaults;
      this.lastFetch = now;
      return this.flags;
    } catch (error) {
      console.warn('Failed to fetch feature flags:', error);
      return defaults;
    }
  }

  private getEnvFlags(): Partial<SecurityFlags> | null {
    if (typeof window !== 'undefined') return null;

    try {
      return {
        underAttack: process.env.UNDER_ATTACK === 'true',
        captchaAlwaysOn: process.env.CAPTCHA_ALWAYS_ON === 'true',
        powEnforceHighRisk: process.env.POW_ENFORCE_HIGH_RISK !== 'false',
        closeSignups: process.env.CLOSE_SIGNUPS === 'true',
        powDifficulty: {
          bits: parseInt(process.env.POW_BITS || '20', 10)
        }
      };
    } catch {
      return null;
    }
  }

  private parseDbFlags(data: Array<{ config_key: string; config_value: any }>): Partial<SecurityFlags> {
    const flags: Partial<SecurityFlags> = {};

    for (const row of data) {
      try {
        const value = row.config_value;
        switch (row.config_key) {
          case 'under_attack':
            flags.underAttack = value.enabled;
            break;
          case 'captcha_always_on':
            flags.captchaAlwaysOn = value.enabled;
            break;
          case 'pow_enforce_high_risk':
            flags.powEnforceHighRisk = value.enabled;
            break;
          case 'close_signups':
            flags.closeSignups = value.enabled;
            break;
          case 'risk_thresholds':
            flags.riskThresholds = value;
            break;
          case 'pow_difficulty':
            flags.powDifficulty = value;
            break;
        }
      } catch (error) {
        console.warn(`Failed to parse flag ${row.config_key}:`, error);
      }
    }

    return flags;
  }

  // Clear cache to force refresh
  invalidate() {
    this.flags = null;
    this.lastFetch = 0;
  }
}

export const featureFlags = new FeatureFlags();