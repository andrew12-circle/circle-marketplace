import { useEffect } from 'react';

// Component to set security headers via meta tags
export const SecurityHeaders: React.FC = () => {
  useEffect(() => {
    // Set Content Security Policy
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' *.supabase.co *.googleapis.com;
      style-src 'self' 'unsafe-inline' *.googleapis.com;
      img-src 'self' data: blob: *.supabase.co *.google.com;
      font-src 'self' *.googleapis.com *.gstatic.com;
      connect-src 'self' *.supabase.co *.googleapis.com;
      media-src 'self' blob: *.supabase.co;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
    `.replace(/\s+/g, ' ').trim();
    
    // Set X-Frame-Options
    const frameMeta = document.createElement('meta');
    frameMeta.httpEquiv = 'X-Frame-Options';
    frameMeta.content = 'DENY';
    
    // Set X-Content-Type-Options
    const nosniffMeta = document.createElement('meta');
    nosniffMeta.httpEquiv = 'X-Content-Type-Options';
    nosniffMeta.content = 'nosniff';
    
    // Set Referrer Policy
    const referrerMeta = document.createElement('meta');
    referrerMeta.name = 'referrer';
    referrerMeta.content = 'strict-origin-when-cross-origin';
    
    // Add meta tags to head
    document.head.appendChild(cspMeta);
    document.head.appendChild(frameMeta);
    document.head.appendChild(nosniffMeta);
    document.head.appendChild(referrerMeta);
    
    // Cleanup function
    return () => {
      try {
        document.head.removeChild(cspMeta);
        document.head.removeChild(frameMeta);
        document.head.removeChild(nosniffMeta);
        document.head.removeChild(referrerMeta);
      } catch (error) {
        // Meta tags may have been removed already
      }
    };
  }, []);
  
  return null; // This component doesn't render anything
};