// FILE: src/lib/security/webauthn-helpers.ts

import { supabase } from '@/integrations/supabase/client';

interface PublicKeyCredentialCreationOptionsJSON {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
  }>;
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    userVerification?: 'required' | 'preferred' | 'discouraged';
    requireResidentKey?: boolean;
  };
  timeout?: number;
  attestation?: 'none' | 'indirect' | 'direct';
}

interface AuthenticatorAttestationResponseJSON {
  clientDataJSON: string;
  attestationObject: string;
}

interface PublicKeyCredentialJSON {
  id: string;
  rawId: string;
  response: AuthenticatorAttestationResponseJSON;
  type: 'public-key';
}

/**
 * WebAuthn/Passkey helper utilities (basic scaffolding)
 */
export class WebAuthnHelpers {
  private rpName = 'SecureApp';
  private rpId = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  /**
   * Check if WebAuthn is supported
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'credentials' in navigator &&
      'create' in navigator.credentials &&
      'get' in navigator.credentials &&
      typeof PublicKeyCredential !== 'undefined'
    );
  }

  /**
   * Generate registration options
   */
  async generateRegistrationOptions(
    userId: string,
    username: string,
    displayName: string
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const challenge = this.generateChallenge();
    
    // Store challenge for verification
    await this.storeChallenge(userId, challenge, 'registration');
    
    return {
      challenge,
      rp: {
        name: this.rpName,
        id: this.rpId
      },
      user: {
        id: this.encodeUserId(userId),
        name: username,
        displayName
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Prefer platform authenticators
        userVerification: 'preferred',
        requireResidentKey: false
      },
      timeout: 60000, // 1 minute
      attestation: 'none'
    };
  }

  /**
   * Verify registration response
   */
  async verifyRegistrationResponse(
    userId: string,
    credential: PublicKeyCredentialJSON
  ): Promise<{ verified: boolean; credentialId?: string }> {
    try {
      // Get stored challenge
      const storedChallenge = await this.getStoredChallenge(userId, 'registration');
      if (!storedChallenge) {
        return { verified: false };
      }

      // Basic validation (in production, use a proper WebAuthn library)
      const clientDataJSON = JSON.parse(
        Buffer.from(credential.response.clientDataJSON, 'base64').toString()
      );

      if (clientDataJSON.challenge !== storedChallenge) {
        return { verified: false };
      }

      if (clientDataJSON.origin !== `https://${this.rpId}` && this.rpId !== 'localhost') {
        return { verified: false };
      }

      // Store credential
      await this.storeCredential(userId, credential);

      // Clean up challenge
      await this.cleanupChallenge(userId, 'registration');

      return { verified: true, credentialId: credential.id };

    } catch (error) {
      console.error('WebAuthn registration verification failed:', error);
      return { verified: false };
    }
  }

  /**
   * Generate authentication options
   */
  async generateAuthenticationOptions(userId?: string): Promise<{
    challenge: string;
    timeout?: number;
    rpId?: string;
    allowCredentials?: Array<{
      type: 'public-key';
      id: string;
    }>;
  }> {
    const challenge = this.generateChallenge();
    
    if (userId) {
      await this.storeChallenge(userId, challenge, 'authentication');
      
      // Get user's credentials
      const userCredentials = await this.getUserCredentials(userId);
      
      return {
        challenge,
        timeout: 60000,
        rpId: this.rpId,
        allowCredentials: userCredentials.map(cred => ({
          type: 'public-key' as const,
          id: cred.credential_id
        }))
      };
    }

    return {
      challenge,
      timeout: 60000,
      rpId: this.rpId
    };
  }

  /**
   * Verify authentication response
   */
  async verifyAuthenticationResponse(
    userId: string,
    response: any
  ): Promise<{ verified: boolean; credentialId?: string }> {
    try {
      // Get stored challenge
      const storedChallenge = await this.getStoredChallenge(userId, 'authentication');
      if (!storedChallenge) {
        return { verified: false };
      }

      // Basic validation (in production, use a proper WebAuthn library)
      const clientDataJSON = JSON.parse(
        Buffer.from(response.response.clientDataJSON, 'base64').toString()
      );

      if (clientDataJSON.challenge !== storedChallenge) {
        return { verified: false };
      }

      // Verify credential exists for user
      const credential = await this.getCredential(userId, response.id);
      if (!credential) {
        return { verified: false };
      }

      // Clean up challenge
      await this.cleanupChallenge(userId, 'authentication');

      return { verified: true, credentialId: response.id };

    } catch (error) {
      console.error('WebAuthn authentication verification failed:', error);
      return { verified: false };
    }
  }

  /**
   * Get user's registered credentials
   */
  async getUserCredentials(userId: string): Promise<Array<{
    id: string;
    credential_id: string;
    created_at: string;
  }>> {
    const { data, error } = await supabase
      .from('user_webauthn_credentials')
      .select('id, credential_id, created_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to fetch WebAuthn credentials:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Remove a credential
   */
  async removeCredential(userId: string, credentialId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_webauthn_credentials')
      .delete()
      .eq('user_id', userId)
      .eq('credential_id', credentialId);

    return !error;
  }

  /**
   * Generate cryptographically secure challenge
   */
  private generateChallenge(): string {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for Node.js
      const crypto = require('crypto');
      const buffer = crypto.randomBytes(32);
      array.set(buffer);
    }
    return Buffer.from(array).toString('base64url');
  }

  /**
   * Encode user ID for WebAuthn
   */
  private encodeUserId(userId: string): string {
    return Buffer.from(userId).toString('base64url');
  }

  /**
   * Store challenge for verification
   */
  private async storeChallenge(
    userId: string,
    challenge: string,
    type: 'registration' | 'authentication'
  ): Promise<void> {
    await supabase
      .from('webauthn_challenges')
      .upsert({
        user_id: userId,
        challenge,
        challenge_type: type,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      }, {
        onConflict: 'user_id,challenge_type'
      });
  }

  /**
   * Get stored challenge
   */
  private async getStoredChallenge(
    userId: string,
    type: 'registration' | 'authentication'
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('webauthn_challenges')
      .select('challenge')
      .eq('user_id', userId)
      .eq('challenge_type', type)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return data.challenge;
  }

  /**
   * Clean up used challenge
   */
  private async cleanupChallenge(
    userId: string,
    type: 'registration' | 'authentication'
  ): Promise<void> {
    await supabase
      .from('webauthn_challenges')
      .delete()
      .eq('user_id', userId)
      .eq('challenge_type', type);
  }

  /**
   * Store credential
   */
  private async storeCredential(
    userId: string,
    credential: PublicKeyCredentialJSON
  ): Promise<void> {
    await supabase
      .from('user_webauthn_credentials')
      .insert({
        user_id: userId,
        credential_id: credential.id,
        credential_data: credential,
        created_at: new Date().toISOString()
      });
  }

  /**
   * Get credential
   */
  private async getCredential(
    userId: string,
    credentialId: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from('user_webauthn_credentials')
      .select('credential_data')
      .eq('user_id', userId)
      .eq('credential_id', credentialId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.credential_data;
  }
}

// Singleton instance
export const webAuthnHelpers = new WebAuthnHelpers();