// FILE: src/lib/security/ip-allowlist.ts

import { isIP } from 'net';

/**
 * Validate IP against admin allowlist
 */
export async function validateIPAllowlist(clientIP: string): Promise<boolean> {
  const allowlistEnv = process.env.ADMIN_IP_ALLOWLIST;
  
  if (!allowlistEnv) {
    // No allowlist configured, allow all (dev mode)
    return true;
  }
  
  const allowedIPs = allowlistEnv.split(',').map(ip => ip.trim());
  
  // Validate each IP in the allowlist
  for (const allowedIP of allowedIPs) {
    if (isIPInRange(clientIP, allowedIP)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if IP is in CIDR range or exact match
 */
function isIPInRange(ip: string, range: string): boolean {
  if (!isIP(ip)) return false;
  
  // Exact match
  if (ip === range) return true;
  
  // CIDR range check (simplified)
  if (range.includes('/')) {
    const [network, prefixLength] = range.split('/');
    const prefix = parseInt(prefixLength, 10);
    
    if (!isIP(network) || prefix < 0 || prefix > 32) return false;
    
    // Convert IPs to integers for comparison
    const ipInt = ipToInt(ip);
    const networkInt = ipToInt(network);
    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    
    return (ipInt & mask) === (networkInt & mask);
  }
  
  return false;
}

/**
 * Convert IPv4 to integer
 */
function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}