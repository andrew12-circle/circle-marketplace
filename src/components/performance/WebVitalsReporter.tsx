import { useEffect } from 'react';
import { onLCP, onINP, onCLS, onTTFB } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  entries?: any[];
}

const WebVitalsReporter = () => {
  useEffect(() => {
    const sessionId = crypto.randomUUID();
    
    const reportMetric = async (metric: WebVitalsMetric) => {
      try {
        const deviceInfo = {
          userAgent: navigator.userAgent,
          connection: (navigator as any).connection?.effectiveType || 'unknown',
          deviceMemory: (navigator as any).deviceMemory || 'unknown',
          hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
        };

        await supabase.from('web_vitals').insert({
          metric_name: metric.name,
          value: metric.value,
          path: window.location.pathname,
          session_id: sessionId,
          device_info: deviceInfo
        });
      } catch (error) {
        // Silently fail to avoid disrupting user experience
        console.debug('Failed to report web vital:', error);
      }
    };

    // Set up Web Vitals observers
    onLCP(reportMetric);
    onINP(reportMetric);
    onCLS(reportMetric);
    onTTFB(reportMetric);

    // Clean up is handled automatically by web-vitals library
  }, []);

  return null; // This component only reports metrics, no UI
};

export default WebVitalsReporter;