// IP Address validation and cleaning utilities
export class IPAddressHelper {
  
  /**
   * Clean and validate IP address input
   * Handles comma-separated IPs and extracts the first valid one
   */
  static cleanIPAddress(input: string | null | undefined): string | null {
    if (!input || typeof input !== 'string') {
      return null;
    }

    try {
      // Remove whitespace and split by comma
      const cleanInput = input.trim();
      if (!cleanInput) return null;

      // If contains comma, take first part
      const ipParts = cleanInput.split(',');
      let candidateIP = ipParts[0].trim();

      // Remove any non-IP characters (but keep dots and numbers)
      candidateIP = candidateIP.replace(/[^0-9.]/g, '');

      // Basic IPv4 validation
      if (this.isValidIPv4(candidateIP)) {
        return candidateIP;
      }

      // If first part failed, try other parts
      for (let i = 1; i < ipParts.length; i++) {
        const nextCandidate = ipParts[i].trim().replace(/[^0-9.]/g, '');
        if (this.isValidIPv4(nextCandidate)) {
          return nextCandidate;
        }
      }

      return null;
    } catch (error) {
      console.warn('Error cleaning IP address:', error);
      return null;
    }
  }

  /**
   * Validate IPv4 format
   */
  static isValidIPv4(ip: string): boolean {
    if (!ip || typeof ip !== 'string') return false;

    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipv4Regex);
    
    if (!match) return false;

    // Check each octet is between 0-255
    for (let i = 1; i <= 4; i++) {
      const octet = parseInt(match[i], 10);
      if (octet < 0 || octet > 255) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get client IP from various headers
   */
  static getClientIP(headers: Record<string, string | string[]>): string | null {
    // Common IP header sources in order of preference
    const ipHeaders = [
      'cf-connecting-ip', // Cloudflare
      'x-real-ip', // nginx
      'x-forwarded-for', // General proxy
      'x-client-ip', // Apache
      'x-cluster-client-ip', // Cluster
      'forwarded-for',
      'forwarded'
    ];

    for (const header of ipHeaders) {
      const value = headers[header];
      if (value) {
        const ipString = Array.isArray(value) ? value[0] : value;
        const cleanedIP = this.cleanIPAddress(ipString);
        if (cleanedIP) {
          return cleanedIP;
        }
      }
    }

    return null;
  }

  /**
   * Safe IP address for database insertion
   */
  static safeIPForDB(ip: string | null | undefined): string | null {
    const cleaned = this.cleanIPAddress(ip);
    return cleaned;
  }
}
