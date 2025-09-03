import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, ShoppingCart, DollarSign, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { useServiceAnalytics } from '@/hooks/useServiceAnalytics';
import { VendorAnalytics } from '@/components/marketplace/VendorAnalytics';
import { OptimizedVendorAnalytics } from '@/components/admin/OptimizedVendorAnalytics';
import SecurityMonitoringPanel from '@/components/admin/SecurityMonitoringPanel';
import { TrafficAnalytics } from '@/components/analytics/TrafficAnalytics';

interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  totalVendors: number;
  totalServices: number;
  totalConsultations: number;
  totalRevenue: number;
  conversionRate: number;
  avgResponseTime: number;
}

interface SystemHealth {
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeConnections: number;
}

export const ComprehensiveAnalyticsDashboard = () => {
  const { user } = useAuth();
  const { analytics, loading: analyticsLoading, refreshAnalytics } = useServiceAnalytics();
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchPlatformMetrics = async () => {
    try {
      const timeFilter = new Date();
      timeFilter.setDate(timeFilter.getDate() - (selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90));

      // Get user counts
      const { data: totalUsersData } = await supabase
        .from('profiles')
        .select('user_id', { count: 'exact' });

      const { data: activeUsersData } = await supabase
        .from('profiles')
        .select('user_id', { count: 'exact' })
        .gte('updated_at', timeFilter.toISOString());

      // Get vendor counts
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('id', { count: 'exact' });

      // Get service counts
      const { data: servicesData } = await supabase
        .from('services')
        .select('id', { count: 'exact' });

      // Get consultation counts
      const { data: consultationsData } = await supabase
        .from('consultation_bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', timeFilter.toISOString());

      // Calculate metrics
      const totalUsers = totalUsersData?.length || 0;
      const activeUsers = activeUsersData?.length || 0;
      const totalVendors = vendorsData?.length || 0;
      const totalServices = servicesData?.length || 0;
      const totalConsultations = consultationsData?.length || 0;

      setPlatformMetrics({
        totalUsers,
        activeUsers,
        totalVendors,
        totalServices,
        totalConsultations,
        totalRevenue: totalConsultations * 150, // Mock revenue calculation
        conversionRate: totalUsers > 0 ? (totalConsultations / totalUsers) * 100 : 0,
        avgResponseTime: 2.3 // Mock response time
      });

    } catch (error) {
      console.error('Error fetching platform metrics:', error);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      // Mock system health data - in real implementation this would come from monitoring services
      setSystemHealth({
        uptime: 99.9,
        responseTime: 245,
        errorRate: 0.02,
        activeConnections: Math.floor(Math.random() * 1000) + 500
      });
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  const refreshAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPlatformMetrics(),
      fetchSystemHealth(),
      refreshAnalytics()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAllData();
  }, [selectedTimeRange]);

  if (loading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive platform insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity Tracking</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Platform Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformMetrics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {platformMetrics?.activeUsers || 0} active this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformMetrics?.totalServices || 0}</div>
                <p className="text-xs text-muted-foreground">
                  From {platformMetrics?.totalVendors || 0} vendors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${platformMetrics?.totalRevenue?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {platformMetrics?.conversionRate?.toFixed(1) || 0}% conversion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consultations</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformMetrics?.totalConsultations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Avg {platformMetrics?.avgResponseTime || 0}h response time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Real-time platform performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uptime</span>
                    <Badge variant="outline" className="text-green-600">
                      {systemHealth?.uptime || 0}%
                    </Badge>
                  </div>
                  <Progress value={systemHealth?.uptime || 0} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Time</span>
                    <span className="text-sm text-muted-foreground">
                      {systemHealth?.responseTime || 0}ms
                    </span>
                  </div>
                  <Progress value={Math.max(0, 100 - (systemHealth?.responseTime || 0) / 10)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {systemHealth?.errorRate || 0}%
                    </span>
                  </div>
                  <Progress value={Math.max(0, 100 - (systemHealth?.errorRate || 0) * 50)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Connections</span>
                    <span className="text-sm text-muted-foreground">
                      {systemHealth?.activeConnections || 0}
                    </span>
                  </div>
                  <Activity className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic">
          <TrafficAnalytics />
        </TabsContent>

        <TabsContent value="vendors">
          {analytics && (
            <VendorAnalytics 
              data={{
                totalViews: analytics.total_views,
                conversionRate: analytics.conversion_rate,
                consultationBookings: analytics.total_bookings,
                campaignSpend: analytics.monthly_revenue,
                recentViews: analytics.services.reduce((sum, s) => sum + s.views_this_month, 0),
                monthlyViews: analytics.total_views,
                partneredAgents: 25,
                campaignsFunded: 12
              }}
              vendorData={{
                name: user?.email?.split('@')[0] || 'Vendor',
                location: 'Digital Services',
                co_marketing_agents: 25,
                campaigns_funded: 12
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="activity">
          <OptimizedVendorAnalytics />
        </TabsContent>

        <TabsContent value="security">
          <SecurityMonitoringPanel />
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Monitoring</CardTitle>
              <CardDescription>Detailed system performance metrics and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Database Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Query Time</span>
                          <span>12ms avg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Connections</span>
                          <span>45/100</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Cache Hit Rate</span>
                          <span>98.5%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">API Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Avg Response</span>
                          <span>245ms</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Requests/min</span>
                          <span>1,234</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Success Rate</span>
                          <span>99.98%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Storage Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Database</span>
                          <span>2.4GB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>File Storage</span>
                          <span>15.6GB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Bandwidth</span>
                          <span>456MB/day</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Performance Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                        <span>High CPU usage detected on database server</span>
                        <Badge variant="outline">Warning</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded">
                        <span>All systems operating normally</span>
                        <Badge variant="outline" className="text-green-600">OK</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};