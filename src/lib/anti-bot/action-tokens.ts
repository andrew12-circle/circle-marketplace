// FILE: src/lib/anti-bot/action-tokens.ts

export interface ActionToken {
  token: string;
  route: string;
  userId?: string;
  expiresAt: number;
}

class ActionTokens {
  private secret: string | null = null;

  private async getSecret(): Promise<string> {
    if (this.secret) return this.secret;
    
    // In production, this should come from environment variables
    if (typeof window === 'undefined') {
      this.secret = process.env.ACTION_TOKEN_SECRET || 'default-dev-secret-change-in-production';
    } else {
      // Client-side doesn't need the secret for verification
      this.secret = 'client-side-placeholder';
    }
    
    return this.secret;
  }

  // Generate signed token (server-side only)
  async generateToken(route: string, userId?: string, ttlMinutes: number = 5): Promise<string> {
    const secret = await this.getSecret();
    const expiresAt = Date.now() + (ttlMinutes * 60 * 1000);
    
    const payload = {
      route,
      userId: userId || null,
      expiresAt,
      iat: Date.now()
    };
    
    const payloadString = JSON.stringify(payload);
    const signature = await this.sign(payloadString, secret);
    
    const token = btoa(payloadString) + '.' + signature;
    return token;
  }

  // Verify token (server-side only)
  async verifyToken(token: string, expectedRoute: string, expectedUserId?: string): Promise<boolean> {
    try {
      const secret = await this.getSecret();
      const [payloadB64, signature] = token.split('.');
      
      if (!payloadB64 || !signature) return false;
      
      const payloadString = atob(payloadB64);
      const payload = JSON.parse(payloadString);
      
      // Verify signature
      const expectedSignature = await this.sign(payloadString, secret);
      if (signature !== expectedSignature) return false;
      
      // Check expiration
      if (Date.now() > payload.expiresAt) return false;
      
      // Check route match
      if (payload.route !== expectedRoute) return false;
      
      // Check user match if specified
      if (expectedUserId && payload.userId !== expectedUserId) return false;
      
      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  // Parse token without verification (for debugging)
  parseToken(token: string): any {
    try {
      const [payloadB64] = token.split('.');
      if (!payloadB64) return null;
      
      const payloadString = atob(payloadB64);
      return JSON.parse(payloadString);
    } catch {
      return null;
    }
  }

  private async sign(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const signatureArray = new Uint8Array(signature);
    
    return Array.from(signatureArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Generate form validation helpers
  generateHoneypot(): { name: string; style: React.CSSProperties; tabIndex: number } {
    return {
      name: `email_${Math.random().toString(36).substring(7)}`,
      style: {
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        visibility: 'hidden',
        opacity: 0,
        pointerEvents: 'none'
      },
      tabIndex: -1
    };
  }

  // Validate form submission timing
  validateSubmissionTiming(formStartTime: number, minTimeMs: number = 2000): boolean {
    const submissionTime = Date.now();
    const timeSpent = submissionTime - formStartTime;
    
    return timeSpent >= minTimeMs;
  }
}

export const actionTokens = new ActionTokens();