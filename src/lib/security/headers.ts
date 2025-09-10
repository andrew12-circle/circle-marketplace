// FILE: src/lib/security/headers.ts

/**
 * Generate comprehensive security headers
 */
export function securityHeaders(nonce: string): Record<string, string> {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const headers: Record<string, string> = {
    // Strict Transport Security
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self)',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', '),
    
    // Remove server fingerprinting
    'Server': 'Enterprise-Security'
  };

  // Only apply strict Cross-Origin policies and cache control in production
  // These can cause asset loading issues in development
  if (isProduction) {
    headers['Cross-Origin-Opener-Policy'] = 'same-origin';
    headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
    headers['Cross-Origin-Resource-Policy'] = 'same-site';
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';
  } else {
    // Development-safe cache headers
    headers['Cache-Control'] = 'no-cache';
  }
  
  return headers;
}