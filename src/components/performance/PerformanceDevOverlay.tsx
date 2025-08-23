import { useState, useEffect } from 'react';
import { onLCP, onINP, onCLS, onTTFB } from 'web-vitals';

interface MetricData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

const PerformanceDevOverlay = () => {
  const [metrics, setMetrics] = useState<Record<string, MetricData>>({});
  const [longTasks, setLongTasks] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when ?perf=1 is in URL
    const urlParams = new URLSearchParams(window.location.search);
    const showPerf = urlParams.get('perf') === '1' || import.meta.env.DEV;
    setIsVisible(showPerf);

    if (!showPerf) return;

    const updateMetric = (metric: MetricData) => {
      setMetrics(prev => ({
        ...prev,
        [metric.name]: metric
      }));
    };

    // Set up observers
    onLCP(updateMetric);
    onINP(updateMetric);
    onCLS(updateMetric);
    onTTFB(updateMetric);

    // Track long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        setLongTasks(prev => prev + list.getEntries().length);
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Some browsers might not support longtask
        console.debug('Long task observation not supported');
      }

      return () => longTaskObserver.disconnect();
    }
  }, []);

  if (!isVisible) return null;

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-400';
      case 'needs-improvement': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatValue = (name: string, value: number) => {
    if (name === 'CLS') return value.toFixed(3);
    return Math.round(value).toString() + 'ms';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs font-mono z-50 min-w-[200px]">
      <div className="text-yellow-400 font-bold mb-2">⚡ Performance Metrics</div>
      
      {Object.entries(metrics).map(([name, metric]) => (
        <div key={name} className="flex justify-between items-center mb-1">
          <span>{name}:</span>
          <span className={getRatingColor(metric.rating)}>
            {formatValue(name, metric.value)}
          </span>
        </div>
      ))}
      
      <div className="flex justify-between items-center mb-1">
        <span>Long Tasks:</span>
        <span className={longTasks > 5 ? 'text-red-400' : 'text-green-400'}>
          {longTasks}
        </span>
      </div>
      
      <div className="text-gray-400 text-[10px] mt-2">
        Add ?perf=1 to URL in production
      </div>
    </div>
  );
};

export default PerformanceDevOverlay;