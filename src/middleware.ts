// FILE: src/middleware.ts
// Security middleware utilities for React/Vite apps

import { riskScorer } from '@/lib/security/risk-scorer';
import { generateNonce } from '@/lib/security/csp';
import { buildCSPHeader } from '@/lib/security/csp';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { validateIPAllowlist } from '@/lib/security/ip-allowlist';
import { securityHeaders } from '@/lib/security/headers';

interface SecurityContext {
  nonce: string;
  riskScore: number;
  headers: Record<string, string>;
}

/**
 * Initialize security context for the application
 */
export async function initializeSecurityContext(
  path?: string,
  clientIP?: string,
  userAgent?: string
): Promise<SecurityContext> {
  // Generate nonce for CSP
  const nonce = generateNonce();
  
  // Risk scoring
  let riskScore = 0;
  if (path?.startsWith('/api/') && clientIP) {
    const riskResult = await riskScorer.calculateRisk(
      clientIP,
      undefined, // userId would come from auth
      userAgent,
      path
    );
    riskScore = riskResult.score;
  }

  // Build security headers
  const baseHeaders = securityHeaders(nonce);
  const cspHeader = buildCSPHeader(nonce);
  
  const headers = {
    ...baseHeaders,
    'Content-Security-Policy': cspHeader
  };

  // Add debug headers in non-production
  if (process.env.NODE_ENV !== 'production' && riskScore > 0) {
    headers['X-Risk-Score'] = riskScore.toString();
  }

  return {
    nonce,
    riskScore,
    headers
  };
}