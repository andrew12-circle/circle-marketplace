import { useEffect } from 'react';

export const EnhancedSecurityHeaders: React.FC = () => {
  useEffect(() => {
    // Enhanced Content Security Policy
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' *.supabase.co *.googleapis.com https://js.stripe.com;
      style-src 'self' 'unsafe-inline' *.googleapis.com;
      img-src 'self' data: blob: *.supabase.co *.google.com *.stripe.com;
      font-src 'self' *.googleapis.com *.gstatic.com;
      connect-src 'self' *.supabase.co *.googleapis.com https://api.stripe.com;
      media-src 'self' blob: *.supabase.co;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      frame-src https://js.stripe.com https://hooks.stripe.com;
      worker-src 'self' blob:;
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim();
    
    // Strict Transport Security
    const stsMeta = document.createElement('meta');
    stsMeta.httpEquiv = 'Strict-Transport-Security';
    stsMeta.content = 'max-age=31536000; includeSubDomains; preload';
    
    // X-Frame-Options
    const frameMeta = document.createElement('meta');
    frameMeta.httpEquiv = 'X-Frame-Options';
    frameMeta.content = 'DENY';
    
    // X-Content-Type-Options
    const nosniffMeta = document.createElement('meta');
    nosniffMeta.httpEquiv = 'X-Content-Type-Options';
    nosniffMeta.content = 'nosniff';
    
    // Referrer Policy
    const referrerMeta = document.createElement('meta');
    referrerMeta.name = 'referrer';
    referrerMeta.content = 'strict-origin-when-cross-origin';
    
    // X-XSS-Protection
    const xssMeta = document.createElement('meta');
    xssMeta.httpEquiv = 'X-XSS-Protection';
    xssMeta.content = '1; mode=block';
    
    // Permissions Policy
    const permissionsMeta = document.createElement('meta');
    permissionsMeta.httpEquiv = 'Permissions-Policy';
    permissionsMeta.content = 'camera=(), microphone=(), geolocation=(), payment=()';
    
    // Add all meta tags to head
    const metaTags = [cspMeta, stsMeta, frameMeta, nosniffMeta, referrerMeta, xssMeta, permissionsMeta];
    metaTags.forEach(tag => document.head.appendChild(tag));
    
    // Cleanup function
    return () => {
      metaTags.forEach(tag => {
        try {
          document.head.removeChild(tag);
        } catch (error) {
          // Meta tags may have been removed already
        }
      });
    };
  }, []);
  
  return null; // This component doesn't render anything
};