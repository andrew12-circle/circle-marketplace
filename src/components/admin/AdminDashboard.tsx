import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminVendorChangesPanel } from "./AdminVendorChangesPanel";
import { 
  BarChart3, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Database,
  Clock,
  Users,
  DollarSign,
  Activity
} from "lucide-react";

interface AdminDashboardProps {
  onCacheRefresh?: () => void;
}

interface CacheStatus {
  servicesCount: number;
  vendorsCount: number;
  lastRefresh: string;
  isStale: boolean;
  dataFreshness: any;
}

interface Analytics {
  totalRevenue: number;
  totalServices: number;
  activeVendors: number;
  conversionRate: number;
  topPerformingServices: any[];
}

export const AdminDashboard = ({ onCacheRefresh }: AdminDashboardProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [lastAnalyticsUpdate, setLastAnalyticsUpdate] = useState<string>('');

  // Load dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Get cache status
      const { data: cacheData } = await supabase
        .from('marketplace_cache')
        .select('*')
        .eq('cache_key', 'marketplace_data')
        .maybeSingle();

      if (cacheData) {
        const metadata = cacheData.cache_data?.metadata || {};
        setCacheStatus({
          servicesCount: metadata.servicesCount || 0,
          vendorsCount: metadata.vendorsCount || 0,
          lastRefresh: cacheData.updated_at,
          isStale: new Date(cacheData.expires_at) < new Date(),
          dataFreshness: metadata.dataFreshness || {}
        });
      }

      // Get analytics data
      const { data: analyticsData } = await supabase.rpc('get_admin_analytics_summary');
      if (analyticsData) {
        setAnalytics(analyticsData);
        setLastAnalyticsUpdate(new Date().toISOString());
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh marketplace cache
  const handleCacheRefresh = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('warm-marketplace-cache');
      
      if (error) throw error;

      toast({
        title: "Cache Refreshed",
        description: `Updated ${data.cached.services} services and ${data.cached.vendors} vendors`,
      });

      // Reload dashboard data
      await loadDashboardData();
      onCacheRefresh?.();

    } catch (error) {
      console.error('Error refreshing cache:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh marketplace cache",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Force marketplace data reload
  const handleForceDataReload = async () => {
    setIsLoading(true);
    try {
      // Clear existing cache
      await supabase
        .from('marketplace_cache')
        .delete()
        .eq('cache_key', 'marketplace_data');

      // Trigger fresh data fetch
      const { data, error } = await supabase.functions.invoke('get-marketplace-data');
      
      if (error) throw error;

      toast({
        title: "Data Reloaded",
        description: "Fresh marketplace data loaded successfully",
      });

      await loadDashboardData();

    } catch (error) {
      console.error('Error reloading data:', error);
      toast({
        title: "Reload Failed",
        description: "Failed to reload marketplace data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor marketplace performance and data flow</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadDashboardData}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cache">Data Cache</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="vendor-changes">Vendor Changes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cacheStatus?.servicesCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {cacheStatus?.dataFreshness?.servicesWithMetrics || 0} with tracking
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cacheStatus?.vendorsCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {cacheStatus?.dataFreshness?.vendorsWithActiveServices || 0} with services
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics?.totalRevenue?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.conversionRate || 0}% conversion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {cacheStatus?.isStale ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-600">Stale</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Fresh</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {cacheStatus ? getTimeAgo(cacheStatus.lastRefresh) : 'Unknown'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Marketplace Data Cache
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Cache Health</p>
                  <p className="text-sm text-muted-foreground">
                    Data freshness and connectivity status
                  </p>
                </div>
                <Badge variant={cacheStatus?.isStale ? "destructive" : "default"}>
                  {cacheStatus?.isStale ? "Stale" : "Fresh"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Data Composition</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Services: {cacheStatus?.servicesCount || 0}</div>
                    <div>Vendors: {cacheStatus?.vendorsCount || 0}</div>
                    <div>With Metrics: {cacheStatus?.dataFreshness?.servicesWithMetrics || 0}</div>
                    <div>Recent Updates: {cacheStatus?.dataFreshness?.servicesWithRecentFunnelUpdates || 0}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Last Refresh</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {cacheStatus ? getTimeAgo(cacheStatus.lastRefresh) : 'Never'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleCacheRefresh}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Warm Cache
                </Button>
                <Button 
                  onClick={handleForceDataReload}
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Force Reload
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Revenue Metrics</p>
                  <div className="text-2xl font-bold">${analytics?.totalRevenue?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-muted-foreground">Total attributed revenue</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Conversion Rate</p>
                  <div className="text-2xl font-bold">{analytics?.conversionRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">View to purchase</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Active Services</p>
                  <div className="text-2xl font-bold">{analytics?.totalServices || 0}</div>
                  <p className="text-xs text-muted-foreground">Currently listed</p>
                </div>
              </div>

              {analytics?.topPerformingServices && (
                <div className="mt-6">
                  <p className="text-sm font-medium mb-3">Top Performing Services</p>
                  <div className="space-y-2">
                    {analytics.topPerformingServices.slice(0, 5).map((service: any, index: number) => (
                      <div key={service.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium text-sm">{service.title}</p>
                          <p className="text-xs text-muted-foreground">{service.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">${service.revenue || 0}</p>
                          <p className="text-xs text-muted-foreground">{service.conversions || 0} sales</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAnalyticsUpdate && (
                <p className="text-xs text-muted-foreground mt-4">
                  Last updated: {getTimeAgo(lastAnalyticsUpdate)}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendor-changes" className="space-y-4">
          <AdminVendorChangesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};