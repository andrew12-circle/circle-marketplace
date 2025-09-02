// FILE: src/lib/security/encryption.ts

import { webcrypto } from 'crypto';

interface EncryptedData {
  ciphertext: string;
  kid: string;
  iv: string;
}

interface EncryptionKey {
  id: string;
  key: string;
  created: string;
}

/**
 * Envelope encryption utilities for PII data
 */
export class FieldEncryption {
  private keys: Map<string, CryptoKey> = new Map();

  constructor() {
    this.loadKeys();
  }

  /**
   * Load encryption keys from environment
   */
  private async loadKeys() {
    const keyData = process.env.ENCRYPTION_KEYS;
    if (!keyData) {
      console.warn('ENCRYPTION_KEYS not configured');
      return;
    }

    try {
      const keys: EncryptionKey[] = JSON.parse(keyData);
      
      for (const keyData of keys) {
        const keyBuffer = Buffer.from(keyData.key, 'base64');
        const cryptoKey = await webcrypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
        this.keys.set(keyData.id, cryptoKey);
      }
    } catch (error) {
      console.error('Failed to load encryption keys:', error);
    }
  }

  /**
   * Encrypt a field value
   */
  async encryptField(plaintext: string, kid?: string): Promise<EncryptedData> {
    if (!kid) {
      kid = this.getCurrentKeyId();
    }

    const key = this.keys.get(kid);
    if (!key) {
      throw new Error(`Encryption key ${kid} not found`);
    }

    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const ciphertext = await webcrypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return {
      ciphertext: Buffer.from(ciphertext).toString('base64'),
      kid,
      iv: Buffer.from(iv).toString('base64')
    };
  }

  /**
   * Decrypt a field value
   */
  async decryptField(encryptedData: EncryptedData): Promise<string> {
    const key = this.keys.get(encryptedData.kid);
    if (!key) {
      throw new Error(`Decryption key ${encryptedData.kid} not found`);
    }

    const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');

    const plaintext = await webcrypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(plaintext);
  }

  /**
   * Rotate field encryption from old key to new key
   */
  async rotateField(encryptedData: EncryptedData, newKid: string): Promise<EncryptedData> {
    const plaintext = await this.decryptField(encryptedData);
    return this.encryptField(plaintext, newKid);
  }

  /**
   * Get current default key ID
   */
  private getCurrentKeyId(): string {
    const keyIds = Array.from(this.keys.keys());
    if (keyIds.length === 0) {
      throw new Error('No encryption keys available');
    }
    // Return the most recent key (assuming lexicographic ordering)
    return keyIds.sort().pop()!;
  }

  /**
   * Generate a new encryption key
   */
  static async generateKey(): Promise<string> {
    const key = await webcrypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const keyBuffer = await webcrypto.subtle.exportKey('raw', key);
    return Buffer.from(keyBuffer).toString('base64');
  }
}

// Singleton instance
export const fieldEncryption = new FieldEncryption();