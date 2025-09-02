// FILE: src/lib/security/webhook-verification.ts

import { webcrypto } from 'crypto';

interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * Webhook signature verification and replay defense
 */
export class WebhookVerifier {
  private replayCache = new Map<string, number>();

  /**
   * Verify Stripe-style webhook signature
   */
  async verifyStripeSignature(
    payload: string,
    signature: string,
    secret: string,
    tolerance: number = 300 // 5 minutes
  ): Promise<WebhookVerificationResult> {
    try {
      const elements = signature.split(',');
      const signatureElements: Record<string, string> = {};

      for (const element of elements) {
        const [key, value] = element.split('=');
        signatureElements[key] = value;
      }

      const timestamp = parseInt(signatureElements.t || '0', 10);
      const signatures = [
        signatureElements.v1,
        signatureElements.v0
      ].filter(Boolean);

      if (!timestamp || signatures.length === 0) {
        return { valid: false, error: 'Invalid signature format' };
      }

      // Check timestamp tolerance
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - timestamp) > tolerance) {
        return { valid: false, error: 'Timestamp outside tolerance' };
      }

      // Verify signature
      const payloadForSignature = `${timestamp}.${payload}`;
      const expectedSignature = await this.computeHmacSha256(payloadForSignature, secret);

      const isValid = signatures.some(sig => this.secureCompare(sig, expectedSignature));

      if (!isValid) {
        return { valid: false, error: 'Signature verification failed' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Verification error' };
    }
  }

  /**
   * Verify generic HMAC webhook
   */
  async verifyHmacSignature(
    payload: string,
    signature: string,
    secret: string,
    algorithm: string = 'sha256'
  ): Promise<WebhookVerificationResult> {
    try {
      const expectedSignature = await this.computeHmacSha256(payload, secret);
      const providedSignature = signature.replace(/^sha256=/, '');

      if (!this.secureCompare(providedSignature, expectedSignature)) {
        return { valid: false, error: 'Signature verification failed' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Verification error' };
    }
  }

  /**
   * Check for replay attacks using event ID
   */
  async checkReplay(
    eventId: string,
    ttlSeconds: number = 300
  ): Promise<boolean> {
    const now = Date.now();
    const expiryTime = now + (ttlSeconds * 1000);

    // Check if event already processed
    if (this.replayCache.has(eventId)) {
      return false; // Replay detected
    }

    // Store event ID with expiry
    this.replayCache.set(eventId, expiryTime);

    // Clean up expired entries
    this.cleanupExpiredEntries(now);

    return true; // Not a replay
  }

  /**
   * Compute HMAC-SHA256 signature
   */
  private async computeHmacSha256(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const payloadData = encoder.encode(payload);

    const cryptoKey = await webcrypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await webcrypto.subtle.sign('HMAC', cryptoKey, payloadData);
    return Buffer.from(signature).toString('hex');
  }

  /**
   * Secure string comparison to prevent timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Clean up expired replay cache entries
   */
  private cleanupExpiredEntries(now: number): void {
    for (const [eventId, expiryTime] of this.replayCache.entries()) {
      if (now > expiryTime) {
        this.replayCache.delete(eventId);
      }
    }
  }
}

// Singleton instance
export const webhookVerifier = new WebhookVerifier();