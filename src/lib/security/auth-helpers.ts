// FILE: src/lib/security/auth-helpers.ts

import { supabase } from '@/integrations/supabase/client';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

interface TOTPSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface StepUpResult {
  required: boolean;
  reason?: string;
}

/**
 * Step-up authentication and TOTP helpers
 */
export class AuthHelpers {
  /**
   * Check if step-up authentication is required
   */
  async requiresStepUp(action: string, userId: string): Promise<StepUpResult> {
    const highValueActions = [
      'billing.change',
      'api.key.access',
      'payout.create',
      'user.delete',
      'admin.escalate'
    ];

    if (!highValueActions.includes(action)) {
      return { required: false };
    }

    // Check if user has recently authenticated
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_step_up_at')
      .eq('user_id', userId)
      .single();

    const lastStepUp = profile?.last_step_up_at;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    if (!lastStepUp || new Date(lastStepUp) < fifteenMinutesAgo) {
      return { 
        required: true, 
        reason: 'High-value action requires recent authentication' 
      };
    }

    return { required: false };
  }

  /**
   * Setup TOTP for a user
   */
  async setupTOTP(userId: string, appName: string = 'SecureApp'): Promise<TOTPSetup> {
    const secret = authenticator.generateSecret();
    
    // Get user email for TOTP label
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .single();

    const label = profile?.display_name || 'User';
    const otpauth = authenticator.keyuri(label, appName, secret);
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(otpauth);
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Store TOTP secret (encrypted)
    await supabase
      .from('user_totp')
      .upsert({
        user_id: userId,
        secret,
        backup_codes: backupCodes,
        enabled: false
      });

    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  /**
   * Verify TOTP token
   */
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_totp')
      .select('secret, enabled')
      .eq('user_id', userId)
      .single();

    if (!data?.secret || !data.enabled) {
      return false;
    }

    return authenticator.verify({ token, secret: data.secret });
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_totp')
      .select('backup_codes')
      .eq('user_id', userId)
      .single();

    if (!data?.backup_codes || !Array.isArray(data.backup_codes)) {
      return false;
    }

    const codeIndex = data.backup_codes.indexOf(code);
    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    const updatedCodes = data.backup_codes.filter((_, index) => index !== codeIndex);
    await supabase
      .from('user_totp')
      .update({ backup_codes: updatedCodes })
      .eq('user_id', userId);

    return true;
  }

  /**
   * Enable TOTP after verification
   */
  async enableTOTP(userId: string, token: string): Promise<boolean> {
    const isValid = await this.verifyTOTP(userId, token);
    if (!isValid) {
      return false;
    }

    await supabase
      .from('user_totp')
      .update({ enabled: true })
      .eq('user_id', userId);

    return true;
  }

  /**
   * Record successful step-up authentication
   */
  async recordStepUp(userId: string): Promise<void> {
    await supabase
      .from('profiles')
      .update({ last_step_up_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Check admin role with IP allowlist
   */
  async validateAdminAccess(userId: string, clientIP: string): Promise<boolean> {
    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();

    if (!profile?.is_admin) {
      return false;
    }

    // Check IP allowlist
    return await this.checkAdminIPAllowlist(clientIP);
  }

  /**
   * Validate admin IP allowlist
   */
  private async checkAdminIPAllowlist(clientIP: string): Promise<boolean> {
    const allowlistEnv = process.env.ADMIN_IP_ALLOWLIST;
    
    if (!allowlistEnv) {
      // No allowlist configured - allow in development, deny in production
      return process.env.NODE_ENV !== 'production';
    }
    
    const allowedIPs = allowlistEnv.split(',').map(ip => ip.trim());
    return allowedIPs.includes(clientIP);
  }
}

// Singleton instance
export const authHelpers = new AuthHelpers();