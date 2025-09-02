// FILE: src/lib/security/session-security.ts

import { supabase } from '@/integrations/supabase/client';
import { webcrypto } from 'crypto';

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  domain?: string;
  path?: string;
}

/**
 * Session and cookie security utilities
 */
export class SessionSecurity {
  /**
   * Generate secure cookie settings
   */
  getSecureCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    };
  }

  /**
   * Generate cryptographically secure session ID
   */
  generateSessionId(): string {
    const array = new Uint8Array(32);
    webcrypto.getRandomValues(array);
    return Buffer.from(array).toString('base64url');
  }

  /**
   * Anti-fixation: rotate session on login
   */
  async rotateSession(userId: string): Promise<string> {
    const newSessionId = this.generateSessionId();
    
    // Invalidate old sessions
    await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        invalidated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    // Create new session
    await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_id: newSessionId,
        is_active: true,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      });

    return newSessionId;
  }

  /**
   * Validate session and update activity
   */
  async validateSession(sessionId: string): Promise<{ valid: boolean; userId?: string }> {
    const { data } = await supabase
      .from('user_sessions')
      .select('user_id, created_at, last_activity')
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .single();

    if (!data) {
      return { valid: false };
    }

    // Check session age (max 30 days)
    const sessionAge = Date.now() - new Date(data.created_at).getTime();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    if (sessionAge > maxAge) {
      await this.invalidateSession(sessionId);
      return { valid: false };
    }

    // Check last activity (max 24 hours inactive)
    const lastActivity = Date.now() - new Date(data.last_activity).getTime();
    const maxInactive = 24 * 60 * 60 * 1000; // 24 hours

    if (lastActivity > maxInactive) {
      await this.invalidateSession(sessionId);
      return { valid: false };
    }

    // Update last activity
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_id', sessionId);

    return { valid: true, userId: data.user_id };
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        invalidated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        invalidated_at: new Date().toISOString()
      })
      .lt('created_at', thirtyDaysAgo.toISOString());
  }
}

/**
 * JWT verification for service-to-service calls
 */
export class JWTVerifier {
  private publicKeys = new Map<string, CryptoKey>();

  /**
   * Verify JWT token
   */
  async verifyJWT(token: string, expectedIssuer: string): Promise<{ valid: boolean; payload?: any }> {
    try {
      const [headerB64, payloadB64, signatureB64] = token.split('.');
      
      if (!headerB64 || !payloadB64 || !signatureB64) {
        return { valid: false };
      }

      const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

      // Check issuer
      if (payload.iss !== expectedIssuer) {
        return { valid: false };
      }

      // Check expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return { valid: false };
      }

      // Verify signature (simplified - in production, use proper JWT library)
      const publicKey = await this.getPublicKey(header.kid);
      if (!publicKey) {
        return { valid: false };
      }

      const signatureValid = await this.verifySignature(
        `${headerB64}.${payloadB64}`,
        signatureB64,
        publicKey
      );

      return { valid: signatureValid, payload: signatureValid ? payload : undefined };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Get public key for verification
   */
  private async getPublicKey(kid: string): Promise<CryptoKey | null> {
    if (this.publicKeys.has(kid)) {
      return this.publicKeys.get(kid)!;
    }

    // In production, fetch from JWKS endpoint
    // For now, return null
    return null;
  }

  /**
   * Verify JWT signature
   */
  private async verifySignature(
    message: string,
    signature: string,
    publicKey: CryptoKey
  ): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const messageData = encoder.encode(message);
      const signatureData = Buffer.from(signature, 'base64url');

      return await webcrypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        publicKey,
        signatureData,
        messageData
      );
    } catch (error) {
      return false;
    }
  }
}

// Singleton instances
export const sessionSecurity = new SessionSecurity();
export const jwtVerifier = new JWTVerifier();