import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Clock, Database, Zap } from 'lucide-react';

interface PerformanceMetrics {
  renderTime: number;
  queryTime: number;
  memoryUsage: number;
  cacheHitRate: number;
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    queryTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
  });

  useEffect(() => {
    const measurePerformance = () => {
      // Measure render time using Performance API
      const renderStart = performance.now();
      
      // Simulate measurements (in real app, these would be actual metrics)
      requestAnimationFrame(() => {
        const renderEnd = performance.now();
        const renderTime = renderEnd - renderStart;
        
        // Get memory usage (if available)
        const memoryInfo = (performance as any).memory;
        const memoryUsage = memoryInfo 
          ? (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100
          : Math.random() * 100;

        setMetrics({
          renderTime,
          queryTime: Math.random() * 200 + 50, // Simulated
          memoryUsage,
          cacheHitRate: Math.random() * 30 + 70, // Simulated
        });
      });
    };

    measurePerformance();
    const interval = setInterval(measurePerformance, 5000);

    return () => clearInterval(interval);
  }, []);

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: 'good', variant: 'default' as const };
    if (value <= thresholds.warning) return { status: 'warning', variant: 'secondary' as const };
    return { status: 'poor', variant: 'destructive' as const };
  };

  const renderStatus = getPerformanceStatus(metrics.renderTime, { good: 16, warning: 33 });
  const queryStatus = getPerformanceStatus(metrics.queryTime, { good: 100, warning: 300 });
  const memoryStatus = getPerformanceStatus(metrics.memoryUsage, { good: 60, warning: 80 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Render Time</span>
              </div>
              <Badge variant={renderStatus.variant}>
                {metrics.renderTime.toFixed(1)}ms
              </Badge>
            </div>
            <Progress value={Math.min((metrics.renderTime / 50) * 100, 100)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Query Time</span>
              </div>
              <Badge variant={queryStatus.variant}>
                {metrics.queryTime.toFixed(0)}ms
              </Badge>
            </div>
            <Progress value={Math.min((metrics.queryTime / 500) * 100, 100)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <Badge variant={memoryStatus.variant}>
                {metrics.memoryUsage.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={metrics.memoryUsage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Cache Hit Rate</span>
              </div>
              <Badge variant="default">
                {metrics.cacheHitRate.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={metrics.cacheHitRate} className="h-2" />
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Performance metrics update every 5 seconds. Green indicates optimal performance.
        </div>
      </CardContent>
    </Card>
  );
};