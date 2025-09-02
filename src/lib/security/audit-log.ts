// FILE: src/lib/security/audit-log.ts

import { supabase } from '@/integrations/supabase/client';

interface AuditEntry {
  actor?: string;
  action: string;
  target: string;
  metadata?: Record<string, any>;
}

/**
 * Immutable audit logging utility
 */
export class AuditLogger {
  /**
   * Write an audit log entry
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_log')
        .insert({
          actor: entry.actor || null,
          action: entry.action,
          target: entry.target,
          metadata: entry.metadata || {}
        });

      if (error) {
        console.error('Failed to write audit log:', error);
        // Don't throw - audit logging failures shouldn't break the main flow
      }
    } catch (error) {
      console.error('Audit log error:', error);
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(action: string, userId?: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      actor: userId,
      action: `auth.${action}`,
      target: 'user_session',
      metadata
    });
  }

  /**
   * Log admin actions
   */
  async logAdmin(action: string, userId: string, target: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      actor: userId,
      action: `admin.${action}`,
      target,
      metadata
    });
  }

  /**
   * Log payment events
   */
  async logPayment(action: string, userId?: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      actor: userId,
      action: `payment.${action}`,
      target: 'payment_intent',
      metadata
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(action: string, userId: string, target: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      actor: userId,
      action: `data.${action}`,
      target,
      metadata
    });
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();