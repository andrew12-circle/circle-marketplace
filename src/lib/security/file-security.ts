// FILE: src/lib/security/file-security.ts

import { supabase } from '@/integrations/supabase/client';

interface UploadPolicy {
  maxSize: number;
  allowedTypes: string[];
  bucket: string;
}

interface ScanResult {
  safe: boolean;
  reason?: string;
}

/**
 * File upload security and malware scanning
 */
export class FileSecurity {
  private uploadPolicies: Map<string, UploadPolicy> = new Map([
    ['avatar', {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      bucket: 'avatars'
    }],
    ['document', {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['application/pdf', 'application/msword', 'text/plain'],
      bucket: 'documents'
    }]
  ]);

  /**
   * Create pre-signed upload URL
   */
  async createPresignedUpload(
    fileName: string,
    fileType: string,
    fileSize: number,
    uploadType: string,
    userId: string
  ): Promise<{ uploadUrl: string; fileKey: string } | null> {
    const policy = this.uploadPolicies.get(uploadType);
    if (!policy) {
      throw new Error('Invalid upload type');
    }

    // Validate file type
    if (!policy.allowedTypes.includes(fileType)) {
      throw new Error('File type not allowed');
    }

    // Validate file size
    if (fileSize > policy.maxSize) {
      throw new Error('File too large');
    }

    // Generate secure file key
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileKey = `${userId}/${timestamp}-${randomId}-${fileName}`;

    try {
      // Create signed URL for upload
      const { data, error } = await supabase.storage
        .from(policy.bucket)
        .createSignedUploadUrl(fileKey);

      if (error) {
        throw error;
      }

      // Queue file for scanning
      await this.queueFileForScanning(fileKey, policy.bucket, userId);

      return {
        uploadUrl: data.signedUrl,
        fileKey
      };
    } catch (error) {
      console.error('Failed to create presigned upload:', error);
      return null;
    }
  }

  /**
   * Queue file for malware scanning
   */
  private async queueFileForScanning(
    fileKey: string,
    bucket: string,
    userId: string
  ): Promise<void> {
    await supabase
      .from('file_scan_queue')
      .insert({
        file_key: fileKey,
        bucket,
        user_id: userId,
        status: 'pending',
        created_at: new Date().toISOString()
      });
  }

  /**
   * Mock malware scanning (replace with real scanner)
   */
  async scanFile(fileKey: string, bucket: string): Promise<ScanResult> {
    try {
      // Download file
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(fileKey);

      if (error) {
        return { safe: false, reason: 'Failed to download file' };
      }

      // Mock scanning logic (replace with ClamAV or managed service)
      const buffer = await data.arrayBuffer();
      const content = new Uint8Array(buffer);

      // Check for common malware signatures (simplified)
      const malwareSignatures = [
        new Uint8Array([0x4D, 0x5A]), // PE executable
        new Uint8Array([0x7F, 0x45, 0x4C, 0x46]) // ELF executable
      ];

      for (const signature of malwareSignatures) {
        if (this.containsSignature(content, signature)) {
          return { safe: false, reason: 'Malware signature detected' };
        }
      }

      return { safe: true };
    } catch (error) {
      return { safe: false, reason: 'Scan failed' };
    }
  }

  /**
   * Process scan results
   */
  async processScanResult(
    fileKey: string,
    bucket: string,
    scanResult: ScanResult
  ): Promise<void> {
    if (!scanResult.safe) {
      // Quarantine or delete malicious file
      await supabase.storage
        .from(bucket)
        .remove([fileKey]);

      // Update scan record
      await supabase
        .from('file_scan_queue')
        .update({
          status: 'quarantined',
          scan_result: scanResult,
          processed_at: new Date().toISOString()
        })
        .eq('file_key', fileKey);
    } else {
      // Mark as safe
      await supabase
        .from('file_scan_queue')
        .update({
          status: 'safe',
          scan_result: scanResult,
          processed_at: new Date().toISOString()
        })
        .eq('file_key', fileKey);
    }
  }

  /**
   * Check if content contains malware signature
   */
  private containsSignature(content: Uint8Array, signature: Uint8Array): boolean {
    for (let i = 0; i <= content.length - signature.length; i++) {
      let match = true;
      for (let j = 0; j < signature.length; j++) {
        if (content[i + j] !== signature[j]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    return false;
  }

  /**
   * Get allowed image domains for next.config.js
   */
  getAllowedImageDomains(): string[] {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const domains = ['localhost'];
    
    if (supabaseUrl) {
      const url = new URL(supabaseUrl);
      domains.push(url.hostname);
    }

    return domains;
  }
}

// Singleton instance
export const fileSecurity = new FileSecurity();