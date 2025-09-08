import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, Clock, Database, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PerformanceMetrics {
  eventLoopLag: number;
  queryTime: number;
  memoryUsage: number;
  memoryMB: number;
  memoryLabel: string;
  cacheHitRate: number;
  totalRequests: number;
  successRate: number;
}

interface ExtendedMetrics extends PerformanceMetrics {
  slowestRequests: Array<{
    endpoint: string;
    method: string;
    duration: number;
  }>;
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<ExtendedMetrics>({
    eventLoopLag: 0,
    queryTime: 0,
    memoryUsage: 0,
    memoryMB: 0,
    memoryLabel: 'N/A',
    cacheHitRate: 0,
    totalRequests: 0,
    successRate: 0,
    slowestRequests: [],
  });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);

  useEffect(() => {
    let lastTimestamp = performance.now();
    
    const measurePerformance = () => {
      // Measure event loop lag (better than render time)
      const currentTimestamp = performance.now();
      const expectedDelay = 100; // We set interval for 100ms
      const actualDelay = currentTimestamp - lastTimestamp;
      const eventLoopLag = Math.max(0, actualDelay - expectedDelay);
      lastTimestamp = currentTimestamp;

      // Get real performance stats
      const perfStats = performanceMonitor.getStats();
      
      // Get accurate memory info
      let memoryUsage = 0;
      let memoryMB = 0;
      let memoryLabel = 'N/A';
      
      try {
        // Try modern accurate memory API first
        if ('measureUserAgentSpecificMemory' in performance) {
          (performance as any).measureUserAgentSpecificMemory().then((result: any) => {
            const totalBytes = result.bytes;
            memoryMB = Math.round(totalBytes / 1024 / 1024);
            memoryLabel = `${memoryMB}MB (Precise)`;
            // We can't get percentage easily with this API, so we'll estimate
            memoryUsage = Math.min((totalBytes / (256 * 1024 * 1024)) * 100, 100);
          }).catch(() => {
            // Fallback handled below
          });
        } else if ((performance as any).memory) {
          // Chrome-only performance.memory API
          const memInfo = (performance as any).memory;
          memoryUsage = (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;
          memoryMB = Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
          memoryLabel = `${memoryMB}MB (JS Heap)`;
        }
      } catch (error) {
        console.debug('Memory measurement not available:', error);
      }

      // Track memory history for stability
      setMemoryHistory(prev => {
        const newHistory = [...prev, memoryUsage].slice(-3); // Keep last 3 readings
        return newHistory;
      });

      setMetrics({
        eventLoopLag: Math.round(eventLoopLag * 10) / 10,
        queryTime: perfStats.averageResponseTime,
        memoryUsage: Math.round(memoryUsage),
        memoryMB,
        memoryLabel,
        cacheHitRate: perfStats.cacheHitRate,
        totalRequests: perfStats.totalRequests,
        successRate: perfStats.successRate,
        slowestRequests: perfStats.slowestRequests.slice(0, 3).map(req => ({
          endpoint: req.endpoint,
          method: req.method,
          duration: Math.round(req.duration)
        })),
      });
    };

    measurePerformance();
    const interval = setInterval(measurePerformance, 100); // More frequent for event loop lag

    return () => clearInterval(interval);
  }, []);

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: 'good', variant: 'default' as const };
    if (value <= thresholds.warning) return { status: 'warning', variant: 'secondary' as const };
    return { status: 'poor', variant: 'destructive' as const };
  };

  // Improved memory status logic - only alert if consistently high and rising
  const getMemoryStatus = () => {
    if (memoryHistory.length < 3) return { status: 'good', variant: 'default' as const };
    
    const isConsistentlyHigh = memoryHistory.every(reading => reading > 85);
    const isRising = memoryHistory[2] > memoryHistory[1] && memoryHistory[1] > memoryHistory[0];
    
    if (isConsistentlyHigh && isRising) return { status: 'poor', variant: 'destructive' as const };
    if (metrics.memoryUsage > 80) return { status: 'warning', variant: 'secondary' as const };
    return { status: 'good', variant: 'default' as const };
  };

  const lagStatus = getPerformanceStatus(metrics.eventLoopLag, { good: 5, warning: 16 });
  const queryStatus = getPerformanceStatus(metrics.queryTime, { good: 100, warning: 300 });
  const memoryStatus = getMemoryStatus();
  const cacheStatus = getPerformanceStatus(100 - metrics.cacheHitRate, { good: 20, warning: 40 }); // Invert for cache (higher is better)

  return (
    <TooltipProvider>
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
                  <span className="text-sm font-medium">Event Loop Lag</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Main thread blocking time</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Badge variant={lagStatus.variant}>
                  {metrics.eventLoopLag.toFixed(1)}ms
                </Badge>
              </div>
              <Progress value={Math.min((metrics.eventLoopLag / 25) * 100, 100)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Query Time</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Average API response ({metrics.totalRequests} requests)</p>
                    </TooltipContent>
                  </Tooltip>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{metrics.memoryLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Badge variant={memoryStatus.variant}>
                  {metrics.memoryUsage > 0 ? `${metrics.memoryUsage}%` : 'N/A'}
                </Badge>
              </div>
              <Progress value={metrics.memoryUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Cache Hit Rate</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Success rate: {metrics.successRate}%</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Badge variant={cacheStatus.variant}>
                  {metrics.cacheHitRate.toFixed(0)}%
                </Badge>
              </div>
              <Progress value={metrics.cacheHitRate} className="h-2" />
            </div>
          </div>

          {metrics.slowestRequests.length > 0 && (
            <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="text-sm">Slowest Requests ({metrics.slowestRequests.length})</span>
                  {isDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {metrics.slowestRequests.map((req, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                    <span className="font-mono">{req.method} {req.endpoint}</span>
                    <Badge variant="outline" className="text-xs">
                      {req.duration}ms
                    </Badge>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="text-xs text-muted-foreground">
            Real-time performance metrics. Event loop lag indicates main thread blocking.
            {metrics.memoryLabel !== 'N/A' && ` Memory: ${metrics.memoryLabel}.`}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};