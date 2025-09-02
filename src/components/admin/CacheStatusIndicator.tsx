import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CacheStatusIndicatorProps {
  onRefresh?: () => void;
  showRefreshButton?: boolean;
}

interface CacheHealth {
  isStale: boolean;
  lastUpdate: string;
  servicesCount: number;
  vendorsCount: number;
  dataFreshness: {
    servicesWithMetrics: number;
    servicesWithRecentFunnelUpdates: number;
  };
}

export const CacheStatusIndicator = ({ 
  onRefresh, 
  showRefreshButton = true 
}: CacheStatusIndicatorProps) => {
  const [cacheHealth, setCacheHealth] = useState<CacheHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const checkCacheHealth = async () => {
    try {
      const { data } = await supabase
        .from('marketplace_cache')
        .select('*')
        .eq('cache_key', 'marketplace_data')
        .maybeSingle();

      if (data) {
        const metadata = data.cache_data?.metadata || {};
        setCacheHealth({
          isStale: new Date(data.expires_at) < new Date(),
          lastUpdate: data.updated_at,
          servicesCount: metadata.servicesCount || 0,
          vendorsCount: metadata.vendorsCount || 0,
          dataFreshness: metadata.dataFreshness || {
            servicesWithMetrics: 0,
            servicesWithRecentFunnelUpdates: 0
          }
        });
      }
    } catch (error) {
      console.error('Error checking cache health:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('warm-marketplace-cache');
      
      if (error) throw error;

      toast({
        title: "Cache Refreshed",
        description: `Updated ${data.cached.services} services and ${data.cached.vendors} vendors`,
      });

      await checkCacheHealth();
      onRefresh?.();

    } catch (error) {
      console.error('Error refreshing cache:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh marketplace cache",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkCacheHealth();
    const interval = setInterval(checkCacheHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  if (!cacheHealth) return null;

  const statusIcon = cacheHealth.isStale ? (
    <AlertTriangle className="h-3 w-3" />
  ) : (
    <CheckCircle className="h-3 w-3" />
  );

  const statusColor = cacheHealth.isStale ? "destructive" : "default";
  const statusText = cacheHealth.isStale ? "Stale" : "Fresh";

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={statusColor} className="flex items-center gap-1">
              {statusIcon}
              {statusText}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1 text-sm">
              <div className="font-medium">Cache Status</div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Updated {getTimeAgo(cacheHealth.lastUpdate)}
              </div>
              <div>Services: {cacheHealth.servicesCount}</div>
              <div>Vendors: {cacheHealth.vendorsCount}</div>
              <div>With Metrics: {cacheHealth.dataFreshness.servicesWithMetrics}</div>
              <div>Recent Updates: {cacheHealth.dataFreshness.servicesWithRecentFunnelUpdates}</div>
            </div>
          </TooltipContent>
        </Tooltip>

        {showRefreshButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-6 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
};