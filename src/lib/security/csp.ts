// FILE: src/lib/security/csp.ts

import { webcrypto } from 'crypto';

/**
 * Generate a cryptographically strong nonce for CSP
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  webcrypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

/**
 * Build Content Security Policy header with nonce
 */
export function buildCSPHeader(nonce: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const turnstileEnabled = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  
  // Base policy
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(turnstileEnabled ? ['https://challenges.cloudflare.com'] : [])
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'" // Required for shadcn/ui components
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:'
    ],
    'connect-src': [
      "'self'",
      supabaseUrl,
      'https://*.supabase.co',
      ...(process.env.UPSTASH_REDIS_REST_URL ? [process.env.UPSTASH_REDIS_REST_URL] : []),
      ...(process.env.STRIPE_PUBLISHABLE_KEY ? ['https://api.stripe.com'] : [])
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"]
  };

  // Convert to CSP string
  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}