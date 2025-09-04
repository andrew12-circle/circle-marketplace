// FILE: src/components/security/TurnstileGate.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, RefreshCw } from 'lucide-react';

interface TurnstileGateProps {
  siteKey?: string;
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: any) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
    onTurnstileLoad?: () => void;
  }
}

export function TurnstileGate({
  siteKey = '0x4AAAAAAAkqiE0MhYzCsJLs', // Real Turnstile site key - replace with your actual site key
  onSuccess,
  onError,
  theme = 'auto',
  size = 'normal',
  className = ''
}: TurnstileGateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Check if Turnstile is already loaded
    if (window.turnstile) {
      setScriptLoaded(true);
      setIsLoading(false);
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="challenges.cloudflare.com"]');
    if (existingScript) {
      // Wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.turnstile) {
          setScriptLoaded(true);
          setIsLoading(false);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // Load Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setScriptLoaded(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      setError('Failed to load Turnstile');
      setIsLoading(false);
      onError?.('Failed to load Turnstile script');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onError]);

  useEffect(() => {
    if (!scriptLoaded || !window.turnstile || !containerRef.current || isRendering || widgetId) {
      return;
    }

    setIsRendering(true);
    
    try {
      // Clear any existing widgets in the container first
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: (token: string) => {
          if (!mountedRef.current) return;
          console.log('Turnstile success:', token);
          onSuccess(token);
        },
        'error-callback': (error: string) => {
          if (!mountedRef.current) return;
          console.error('Turnstile error:', error);
          setError(error);
          onError?.(error);
        },
        'expired-callback': () => {
          if (!mountedRef.current) return;
          console.log('Turnstile expired');
          setError('Verification expired');
          onError?.('Verification expired');
        },
        'timeout-callback': () => {
          if (!mountedRef.current) return;
          console.log('Turnstile timeout');
          setError('Verification timed out');
          onError?.('Verification timed out');
        }
      });

      if (mountedRef.current) {
        setWidgetId(id);
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error('Error rendering Turnstile:', error);
        setError('Failed to render verification');
        onError?.('Failed to render verification');
      }
    } finally {
      if (mountedRef.current) {
        setIsRendering(false);
      }
    }
  }, [scriptLoaded, siteKey, theme, size, onSuccess, onError, isRendering, widgetId]);

  // Cleanup effect
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (e) {
          console.warn('Error removing Turnstile widget:', e);
        }
      }
    };
  }, [widgetId]);

  const handleRetry = () => {
    setError(null);
    
    if (widgetId && window.turnstile) {
      try {
        window.turnstile.reset(widgetId);
      } catch (e) {
        console.warn('Error resetting Turnstile:', e);
        // If reset fails, remove and recreate the widget
        try {
          window.turnstile.remove(widgetId);
          setWidgetId(null);
          setIsRendering(false);
        } catch (removeError) {
          console.warn('Error removing widget after reset failure:', removeError);
        }
      }
    } else {
      // No existing widget, clear the container and allow re-render
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      setWidgetId(null);
      setIsRendering(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading security verification...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-destructive">
              <Shield className="h-4 w-4" />
              <span>Verification Error</span>
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={handleRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Security Verification</span>
          </div>
          <div ref={containerRef} className="flex justify-center" />
          <p className="text-xs text-muted-foreground">
            Please complete the verification to continue
          </p>
        </div>
      </CardContent>
    </Card>
  );
}