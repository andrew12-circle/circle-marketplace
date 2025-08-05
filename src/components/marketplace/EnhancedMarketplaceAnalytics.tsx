import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, Clock, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { marketplaceAPI } from '@/services/marketplaceAPI';

interface MarketplaceMetrics {
  totalServices: number;
  totalVendors: number;
  averageLoadTime: number;
  cacheHitRate: number;
  activeUsers: number;
  errorRate: number;
  popularCategories: Array<{ category: string; count: number }>;
  recentActivity: Array<{ type: string; timestamp: string; details: string }>;
}

export const EnhancedMarketplaceAnalytics = () => {
  const [metrics, setMetrics] = useState<MarketplaceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Get basic counts
      const [servicesResponse, vendorsResponse] = await Promise.allSettled([
        supabase.from('services').select('category', { count: 'exact' }),
        supabase.from('vendors').select('*', { count: 'exact' })
      ]);

      const totalServices = servicesResponse.status === 'fulfilled' ? 
        (servicesResponse.value.count || 0) : 0;
      const totalVendors = vendorsResponse.status === 'fulfilled' ? 
        (vendorsResponse.value.count || 0) : 0;

      // Get category distribution
      const { data: categoryData } = await supabase
        .from('services')
        .select('category')
        .limit(1000);

      const categoryCounts = (categoryData || []).reduce((acc, service) => {
        const category = service.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const popularCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Mock performance metrics (would be collected from actual monitoring)
      const performanceMetrics = {
        averageLoadTime: Math.random() * 500 + 200, // 200-700ms
        cacheHitRate: Math.random() * 30 + 70, // 70-100%
        activeUsers: Math.floor(Math.random() * 50 + 10), // 10-60 users
        errorRate: Math.random() * 2 // 0-2%
      };

      // Get recent activity from background jobs
      const { data: recentJobs } = await supabase
        .from('background_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const recentActivity = (recentJobs || []).map(job => ({
        type: job.job_type,
        timestamp: job.created_at,
        details: `${job.status} - Priority: ${job.priority}`
      }));

      setMetrics({
        totalServices,
        totalVendors,
        ...performanceMetrics,
        popularCategories,
        recentActivity
      });

    } catch (error) {
      console.error('Error loading marketplace metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    
    // Queue analytics refresh job
    await marketplaceAPI.queueBackgroundJob('refresh_analytics', {}, 1);
    
    // Reload metrics
    await loadMetrics();
    setRefreshing(false);
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading analytics...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Failed to load analytics data
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthStatus = () => {
    if (metrics.errorRate > 1) return { status: 'Poor', color: 'destructive' };
    if (metrics.averageLoadTime > 500) return { status: 'Slow', color: 'warning' };
    if (metrics.cacheHitRate < 80) return { status: 'Needs Optimization', color: 'warning' };
    return { status: 'Healthy', color: 'success' };
  };

  const health = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Services</p>
                <p className="text-2xl font-bold">{metrics.totalServices}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vendors</p>
                <p className="text-2xl font-bold">{metrics.totalVendors}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Load Time</p>
                <p className="text-2xl font-bold">{Math.round(metrics.averageLoadTime)}ms</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{Math.round(metrics.cacheHitRate)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>System Health</CardTitle>
          <Badge variant={health.color as any}>
            {health.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-xl font-bold">{metrics.activeUsers}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Error Rate</p>
              <p className="text-xl font-bold">{metrics.errorRate.toFixed(2)}%</p>
            </div>
            <div className="text-center">
              <Button onClick={refreshAnalytics} disabled={refreshing}>
                {refreshing ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh Analytics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.popularCategories.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <span className="font-medium">#{index + 1} {category.category}</span>
                <Badge variant="outline">{category.count} services</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Background Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.recentActivity.length > 0 ? (
              metrics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{activity.type}</p>
                    <p className="text-sm text-muted-foreground">{activity.details}</p>
                  </div>
                  <Badge variant="outline">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      {(metrics.errorRate > 1 || metrics.averageLoadTime > 500 || metrics.cacheHitRate < 80) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
              Performance Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.errorRate > 1 && (
                <p className="text-sm">• High error rate detected. Check system logs and database connections.</p>
              )}
              {metrics.averageLoadTime > 500 && (
                <p className="text-sm">• Slow response times. Consider optimizing database queries and adding more indexes.</p>
              )}
              {metrics.cacheHitRate < 80 && (
                <p className="text-sm">• Low cache hit rate. Review caching strategy and increase cache TTL for static data.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};