import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PERF_FLAGS, useSafeMode, shouldLazyLoad } from "@/config/perfFlags";
import { safePerfLogger } from "@/utils/safePerformanceLogger";
import { Activity, Settings, Play, Pause, RefreshCw, BarChart3, AlertTriangle, CheckCircle } from "lucide-react";

export const PerformanceSystemPanel = () => {
  const { toast } = useToast();
  const [isLoggerRunning, setIsLoggerRunning] = useState(false);
  const [perfLogs, setPerfLogs] = useState<any[]>([]);
  const [perfSummary, setPerfSummary] = useState<any[]>([]);
  const [flags, setFlags] = useState(PERF_FLAGS);

  useEffect(() => {
    // Check if logger is running (we can't directly check, so assume it's not running initially)
    updatePerfData();
  }, []);

  const updatePerfData = () => {
    setPerfLogs(safePerfLogger.getRecentLogs());
    setPerfSummary(safePerfLogger.getSummary());
  };

  const handleStartLogger = () => {
    safePerfLogger.start();
    setIsLoggerRunning(true);
    toast({
      title: "Performance Logger Started",
      description: "Now collecting performance metrics.",
    });
  };

  const handleStopLogger = () => {
    safePerfLogger.stop();
    setIsLoggerRunning(false);
    toast({
      title: "Performance Logger Stopped",
      description: "Performance metrics collection stopped.",
    });
  };

  const handleFlagToggle = (flagName: keyof typeof PERF_FLAGS) => {
    // Note: This is for display only since PERF_FLAGS is a const object
    // In a real implementation, you'd need to modify the actual config or use a dynamic system
    toast({
      title: "Performance Flag",
      description: `${flagName} toggle requested. Requires code deployment to take effect.`,
    });
  };

  const safeMode = useSafeMode();

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance System Status
          </CardTitle>
          <CardDescription>
            Current performance optimization settings and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {safeMode ? (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span className="font-medium">
                {safeMode ? 'Safe Mode Active' : 'Optimizations Enabled'}
              </span>
            </div>
            <Badge variant={safeMode ? "secondary" : "default"}>
              {safeMode ? 'SAFE' : 'OPTIMIZED'}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {safeMode 
              ? 'All risky optimizations are disabled for maximum stability'
              : 'Performance optimizations are active'
            }
          </div>
        </CardContent>
      </Card>

      {/* Performance Flags Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Performance Flags
          </CardTitle>
          <CardDescription>
            Current performance feature flag configuration (read-only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(flags).map(([key, value]) => {
              if (key === 'DEV_TIMING') return null; // Skip dev-only flag
              
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{key.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-muted-foreground">
                      {getFlagDescription(key as keyof typeof PERF_FLAGS)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={value ? "default" : "outline"}>
                      {value ? 'ON' : 'OFF'}
                    </Badge>
                    <Switch 
                      checked={value}
                      onCheckedChange={() => handleFlagToggle(key as keyof typeof PERF_FLAGS)}
                      disabled={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-md">
            <strong>Note:</strong> Performance flags are currently read-only and require code deployment to modify. 
            This interface shows the current configuration for monitoring purposes.
          </div>
        </CardContent>
      </Card>

      {/* Performance Logger Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Logger
          </CardTitle>
          <CardDescription>
            Opt-in performance monitoring and logging controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLoggerRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="font-medium">
                Logger Status: {isLoggerRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            <div className="flex gap-2">
              {!isLoggerRunning ? (
                <Button size="sm" onClick={handleStartLogger} className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Start Logging
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleStopLogger} className="flex items-center gap-2">
                  <Pause className="w-4 h-4" />
                  Stop Logging
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={updatePerfData} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Performance Summary */}
          {perfSummary.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Performance Summary</h4>
                <div className="space-y-1 text-sm">
                  {perfSummary.slice(0, 8).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="truncate">{item.action}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.avgDuration}ms avg
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          ×{item.count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Recent Logs */}
          {perfLogs.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Recent Performance Logs</h4>
                <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
                  {perfLogs.map((log, index) => (
                    <div key={index} className="flex justify-between text-muted-foreground">
                      <span className="truncate">{log.action}</span>
                      <span>{log.duration.toFixed(1)}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {perfLogs.length === 0 && perfSummary.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No performance data available</p>
              <p className="text-xs">Start the logger to begin collecting metrics</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function getFlagDescription(flag: keyof typeof PERF_FLAGS): string {
  const descriptions = {
    SAFE_MODE: 'Master switch - disables all risky optimizations when enabled',
    LAZY_MARKETPLACE: 'Enable lazy loading for marketplace components',
    LAZY_HELP_COMPONENTS: 'Enable lazy loading for help and tutorial components',
    CONTENT_VISIBILITY: 'Enable CSS content-visibility optimizations',
    CRITICAL_CONTENT_WRAPPERS: 'Enable critical content rendering wrappers',
    TASK_SCHEDULER: 'Enable time-slicing task scheduler for background work',
    NETWORK_OPTIMIZATIONS: 'Enable network request optimizations and caching',
    CSS_OPTIMIZATIONS: 'Enable CSS loading and rendering optimizations',
    DEV_TIMING: 'Enable development timing diagnostics'
  };
  
  return descriptions[flag] || 'Performance optimization flag';
}