// Dynamic chart loading to reduce bundle size
import React, { useState, useEffect, ComponentType } from 'react';

interface ChartLoaderProps {
  chartType: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  config?: any;
  fallback?: ComponentType;
}

// Lightweight chart placeholders for immediate rendering
const ChartPlaceholder: React.FC<{ type: string }> = ({ type }) => (
  React.createElement('div', {
    className: 'w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center animate-pulse'
  }, React.createElement('div', { className: 'text-center' }, [
    React.createElement('div', { key: 'icon', className: 'w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg mx-auto mb-2' }),
    React.createElement('p', { key: 'text', className: 'text-sm text-gray-500' }, `Loading ${type} chart...`)
  ]))
);

// Chart component mappings
const chartComponents = {
  line: 'LineChart',
  bar: 'BarChart', 
  pie: 'PieChart',
  area: 'AreaChart'
} as const;

// Dynamic chart loader component
export const DynamicChart: React.FC<ChartLoaderProps> = ({ 
  chartType, 
  data, 
  config = {},
  fallback: Fallback = ChartPlaceholder 
}) => {
  const [ChartComponent, setChartComponent] = useState<ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadChart = async () => {
      try {
        // Only load charts when actually needed
        const recharts = await import('recharts');
        
        if (!isMounted) return;
        
        const componentName = chartComponents[chartType];
        const Component = recharts[componentName];
        
        if (Component) {
          setChartComponent(() => Component);
        } else {
          setError(`Chart type ${chartType} not found`);
        }
      } catch (err) {
        if (isMounted) {
          setError(`Failed to load chart: ${err}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Defer chart loading to avoid blocking initial render
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(loadChart, { timeout: 2000 });
    } else {
      setTimeout(loadChart, 300);
    }

    return () => {
      isMounted = false;
    };
  }, [chartType]);

  if (error) {
    return React.createElement(Fallback as any, { type: chartType });
  }

  if (isLoading || !ChartComponent) {
    return React.createElement(Fallback as any, { type: chartType });
  }

  return React.createElement(ChartComponent, { data, ...config });
};

// Hook for conditional chart loading
export const useConditionalCharts = () => {
  const [chartsLoaded, setChartsLoaded] = useState(false);

  const loadCharts = async () => {
    if (chartsLoaded) return;
    
    try {
      await import('recharts');
      setChartsLoaded(true);
    } catch (error) {
      console.warn('Failed to load charts:', error);
    }
  };

  return { chartsLoaded, loadCharts };
};

// Preload charts for specific routes
export const preloadChartsForRoute = (route: string) => {
  const chartRoutes = ['/dashboard', '/analytics', '/vendor-dashboard', '/command-center'];
  
  if (chartRoutes.some(r => route.includes(r))) {
    // Use low priority to avoid blocking other resources
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        import('recharts').catch(() => {
          // Silent fail for preload
        });
      }, { timeout: 5000 });
    }
  }
};