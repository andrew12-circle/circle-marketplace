import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cacheManager } from '@/utils/cacheManager';
import { globalErrorMonitor } from '@/utils/globalErrorMonitor';
import { useToast } from '@/hooks/use-toast';
import { useAppConfig } from '@/hooks/useAppConfig';

export const SystemHealthPanel = () => {
  const { toast } = useToast();
  const { data: config, refetch: refetchConfig } = useAppConfig();
  const healthStatus = globalErrorMonitor.getHealthStatus();
  const cacheInfo = cacheManager.getCacheInfo();

  const handleClearCachePreserveSession = async () => {
    try {
      await cacheManager.clearAllCachePreserveSession();
      toast({
        title: "Cache Cleared",
        description: "Cache cleared successfully (session preserved)",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    }
  };

  const handleRefreshConfig = () => {
    refetchConfig();
    toast({
      title: "Configuration Refreshed",
      description: "App configuration has been reloaded from server",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health & Cache Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Status */}
        <div>
          <h4 className="text-sm font-medium mb-2">Application Health</h4>
          <div className="flex items-center gap-2">
            <Badge variant={healthStatus.isHealthy ? "default" : "destructive"}>
              {healthStatus.isHealthy ? "Healthy" : "Issues Detected"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {healthStatus.recentErrors} recent errors | Boot canary: {healthStatus.bootCanaryPassed ? "✅" : "❌"}
            </span>
          </div>
        </div>

        {/* Cache Information */}
        <div>
          <h4 className="text-sm font-medium mb-2">Cache Status</h4>
          <p className="text-sm text-muted-foreground mb-3">
            {cacheInfo.size} items in localStorage
          </p>
          <Button 
            variant="outline" 
            onClick={handleClearCachePreserveSession}
            className="w-full"
          >
            Clear Cache (Preserve Session)
          </Button>
        </div>

        {/* Server Configuration */}
        <div>
          <h4 className="text-sm font-medium mb-2">Server Configuration</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Marketplace:</span>
            <Badge variant={(config as any)?.marketplace_enabled ? "default" : "secondary"}>
              {(config as any)?.marketplace_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Auto-heal:</span>
            <Badge variant={(config as any)?.auto_heal_enabled ? "default" : "secondary"}>
              {(config as any)?.auto_heal_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Top Deals:</span>
            <Badge variant={(config as any)?.top_deals_enabled ? "default" : "secondary"}>
              {(config as any)?.top_deals_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Security Global:</span>
            <Badge variant={(config as any)?.security_monitoring_global ? "destructive" : "default"}>
              {(config as any)?.security_monitoring_global ? "Global" : "Scoped"}
              </Badge>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshConfig}
            className="mt-3 w-full"
          >
            Refresh Configuration
          </Button>
        </div>

        {/* Performance Metrics */}
        <div>
          <h4 className="text-sm font-medium mb-2">Performance</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Error Monitor: {healthStatus.errorCount} total errors tracked</div>
            <div>Last Reload: {sessionStorage.getItem('last_reload_reason') || 'None'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};