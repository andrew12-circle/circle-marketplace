// FILE: src/lib/security/fetch-validator.ts

import { isIP } from 'net';
import dns from 'dns/promises';

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * SSRF protection and fetch validation
 */
export class SecureFetch {
  private allowedHosts: Set<string>;
  private allowedSchemes = new Set(['https', 'http']);
  private blockedPorts = new Set([22, 23, 25, 53, 80, 135, 139, 445, 993, 995]);
  private privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i
  ];

  constructor(allowedHosts: string[] = []) {
    this.allowedHosts = new Set(allowedHosts);
  }

  /**
   * Secure fetch with SSRF protection
   */
  async secureFetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const validation = await this.validateUrl(url);
    if (!validation.allowed) {
      throw new Error(`Blocked URL: ${validation.reason}`);
    }

    const { timeout = 10000, ...fetchOptions } = options;

    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'User-Agent': 'SecureApp/1.0',
          ...fetchOptions.headers
        }
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Validate URL for SSRF protection
   */
  async validateUrl(url: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const urlObj = new URL(url);

      // Check scheme
      if (!this.allowedSchemes.has(urlObj.protocol.slice(0, -1))) {
        return { allowed: false, reason: 'Blocked scheme' };
      }

      // Check if host is in allowlist
      if (this.allowedHosts.size > 0 && !this.allowedHosts.has(urlObj.hostname)) {
        return { allowed: false, reason: 'Host not in allowlist' };
      }

      // Check for blocked ports
      const port = urlObj.port ? parseInt(urlObj.port, 10) : (urlObj.protocol === 'https:' ? 443 : 80);
      if (this.blockedPorts.has(port)) {
        return { allowed: false, reason: 'Blocked port' };
      }

      // Resolve DNS and check for private IPs
      if (process.env.NODE_ENV === 'production') {
        const dnsResult = await this.checkDnsResolution(urlObj.hostname);
        if (!dnsResult.allowed) {
          return dnsResult;
        }
      }

      return { allowed: true };
    } catch (error) {
      return { allowed: false, reason: 'Invalid URL' };
    }
  }

  /**
   * Check DNS resolution for private IPs
   */
  private async checkDnsResolution(hostname: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Skip DNS check for localhost and IPs
      if (hostname === 'localhost' || isIP(hostname)) {
        if (this.isPrivateIP(hostname)) {
          return { allowed: false, reason: 'Private IP address' };
        }
        return { allowed: true };
      }

      // Resolve hostname
      const addresses = await dns.resolve4(hostname);
      
      for (const address of addresses) {
        if (this.isPrivateIP(address)) {
          return { allowed: false, reason: 'Resolves to private IP' };
        }
      }

      return { allowed: true };
    } catch (error) {
      return { allowed: false, reason: 'DNS resolution failed' };
    }
  }

  /**
   * Check if IP is in private range
   */
  private isPrivateIP(ip: string): boolean {
    return this.privateRanges.some(range => range.test(ip));
  }

  /**
   * Add allowed host
   */
  addAllowedHost(host: string): void {
    this.allowedHosts.add(host);
  }

  /**
   * Remove allowed host
   */
  removeAllowedHost(host: string): void {
    this.allowedHosts.delete(host);
  }
}

// Create instances for different use cases
export const externalApiFetch = new SecureFetch([
  'api.stripe.com',
  'api.github.com',
  'httpbin.org'
]);

export const webhookFetch = new SecureFetch();

// Default secure fetch
export const secureFetch = new SecureFetch();