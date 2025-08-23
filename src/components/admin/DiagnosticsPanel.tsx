import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { globalErrorMonitor } from "@/utils/globalErrorMonitor";
import { cacheManager } from "@/utils/cacheManager";
import { perfLogger } from "@/utils/performanceLogger";
import { Monitor, Trash2, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export const DiagnosticsPanel = () => {
  const { toast } = useToast();
  const [healthStatus, setHealthStatus] = useState<any>({});
  const [cacheInfo, setCacheInfo] = useState<any>({});
  const [perfSummary, setPerfSummary] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    updateDiagnostics();
  }, []);

  const updateDiagnostics = () => {
    setHealthStatus(globalErrorMonitor.getHealthStatus());
    setCacheInfo(cacheManager.getCacheInfo());
    setPerfSummary(perfLogger.getSummary());
    setRecentLogs(perfLogger.getRecentLogs());
  };

  const handleClearCache = async () => {
    await cacheManager.clearAllCachePreserveSession();
    updateDiagnostics();
    toast({
      title: "Cache Cleared",
      description: "All caches have been cleared while preserving your session.",
    });
  };

  const handleSoftReload = () => {
    cacheManager.forceReload('manual');
  };

  const enableVerboseLogging = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('qa', '1');
    window.history.replaceState({}, '', url.toString());
    toast({
      title: "Verbose Logging Enabled",
      description: "Detailed performance and debug logs are now active for this session.",
    });
  };

  const lastReloadReason = sessionStorage.getItem('last_reload_reason');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          System Diagnostics
        </CardTitle>
        <CardDescription>
          Real-time health monitoring and performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Status */}
        <div>
          <h4 className="font-medium mb-2">Application Health</h4>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              {healthStatus.isHealthy ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
              <span>
                Status: {healthStatus.isHealthy ? 'Healthy' : 'Degraded'}
              </span>
            </div>
            <Badge variant="outline">
              {healthStatus.recentErrors || 0} recent errors
            </Badge>
            <Badge variant={healthStatus.bootCanaryPassed ? "default" : "destructive"}>
              Boot Check: {healthStatus.bootCanaryPassed ? 'Passed' : 'Failed'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Cache Info */}
        <div>
          <h4 className="font-medium mb-2">Cache Status</h4>
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline">
              {cacheInfo.size || 0} items in localStorage
            </Badge>
            {lastReloadReason && (
              <Badge variant="secondary">
                Last reload: {lastReloadReason}
              </Badge>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleClearCache}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cache
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleSoftReload}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Soft Reload
            </Button>
          </div>
        </div>

        <Separator />

        {/* Performance Summary */}
        <div>
          <h4 className="font-medium mb-2">Performance Summary</h4>
          {perfSummary.length > 0 ? (
            <div className="space-y-1 text-sm">
              {perfSummary.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>{item.action}</span>
                  <Badge variant="outline">
                    {item.avgDuration}ms (×{item.count})
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No performance data available</p>
          )}
        </div>

        <Separator />

        {/* Debugging Tools */}
        <div>
          <h4 className="font-medium mb-2">Debugging Tools</h4>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={enableVerboseLogging}
            >
              Enable Verbose Logging
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={updateDiagnostics}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Current URL parameters: {window.location.search || 'None'}
          </p>
        </div>

        {/* Recent Performance Logs (QA Mode) */}
        {new URLSearchParams(window.location.search).get('qa') === '1' && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Recent Performance Logs</h4>
              <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
                {recentLogs.map((log, index) => (
                  <div key={index} className="flex justify-between text-muted-foreground">
                    <span>{log.action}</span>
                    <span>{log.duration.toFixed(1)}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};