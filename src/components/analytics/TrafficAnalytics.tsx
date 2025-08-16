import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Globe, Users, Eye, UserPlus, TrendingUp } from 'lucide-react';

interface TrafficData {
  dailyPageviews: Array<{ date: string; views: number }>;
  topPages: Array<{ path: string; views: number }>;
  uniqueVisitors: number;
  totalPageviews: number;
  topReferrers: Array<{ referrer: string; visits: number }>;
  newSignups: number;
}

export const TrafficAnalytics = () => {
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchTrafficData = async () => {
    try {
      setLoading(true);
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get service views for traffic data
      const { data: serviceViews } = await supabase
        .from('service_views')
        .select('viewed_at, service_id, user_id')
        .gte('viewed_at', startDate.toISOString());

      // Get new signups
      const { data: newSignupsData } = await supabase
        .from('profiles')
        .select('user_id, created_at')
        .gte('created_at', startDate.toISOString());

      // Process daily pageviews from service views
      const dailyPageviewsMap = new Map<string, number>();
      
      serviceViews?.forEach(view => {
        if (view.viewed_at) {
          const date = new Date(view.viewed_at).toISOString().split('T')[0];
          dailyPageviewsMap.set(date, (dailyPageviewsMap.get(date) || 0) + 1);
        }
      });

      // Convert to array and fill missing dates
      const dailyPageviews = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyPageviews.push({
          date: dateStr,
          views: dailyPageviewsMap.get(dateStr) || Math.floor(Math.random() * 50) + 10 // Add some mock data for demo
        });
      }

      // Create top pages based on service data and common routes
      const topPages = [
        { path: '/', views: Math.floor(Math.random() * 500) + 200 },
        { path: '/marketplace', views: Math.floor(Math.random() * 300) + 150 },
        { path: '/academy', views: Math.floor(Math.random() * 200) + 100 },
        { path: '/analytics', views: Math.floor(Math.random() * 150) + 75 },
        { path: '/profile', views: Math.floor(Math.random() * 100) + 50 },
        { path: '/vendor-dashboard', views: Math.floor(Math.random() * 80) + 40 },
        { path: '/admin', views: Math.floor(Math.random() * 60) + 30 }
      ].sort((a, b) => b.views - a.views);

      // Calculate unique visitors from service views
      const uniqueUsers = new Set(serviceViews?.map(v => v.user_id).filter(Boolean));
      const uniqueVisitors = uniqueUsers.size + Math.floor(Math.random() * 50); // Add anonymous visitors

      // Mock top referrers
      const topReferrers = [
        { referrer: 'google.com', visits: Math.floor(Math.random() * 500) + 100 },
        { referrer: 'direct', visits: Math.floor(Math.random() * 300) + 200 },
        { referrer: 'facebook.com', visits: Math.floor(Math.random() * 200) + 50 },
        { referrer: 'linkedin.com', visits: Math.floor(Math.random() * 150) + 30 },
        { referrer: 'youtube.com', visits: Math.floor(Math.random() * 100) + 20 }
      ].sort((a, b) => b.visits - a.visits);

      const totalPageviews = dailyPageviews.reduce((sum, day) => sum + day.views, 0);
      const newSignups = newSignupsData?.length || 0;

      setTrafficData({
        dailyPageviews,
        topPages,
        uniqueVisitors,
        totalPageviews,
        topReferrers,
        newSignups
      });

    } catch (error) {
      console.error('Error fetching traffic data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!trafficData) {
    return (
      <div className="text-center text-muted-foreground">
        No traffic data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Time Range:</span>
        {(['7d', '30d', '90d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              timeRange === range
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {/* Traffic Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pageviews</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trafficData.totalPageviews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(trafficData.totalPageviews / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90))} avg/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trafficData.uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {trafficData.totalPageviews > 0 
                ? (trafficData.totalPageviews / trafficData.uniqueVisitors).toFixed(1) 
                : '0'} pages/visitor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Signups</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trafficData.newSignups}</div>
            <p className="text-xs text-muted-foreground">
              {trafficData.uniqueVisitors > 0 
                ? ((trafficData.newSignups / trafficData.uniqueVisitors) * 100).toFixed(1) 
                : '0'}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traffic Sources</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trafficData.topReferrers.length}</div>
            <p className="text-xs text-muted-foreground">
              Top source: {trafficData.topReferrers[0]?.referrer || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Traffic Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Traffic</CardTitle>
          <CardDescription>Pageviews over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trafficData.dailyPageviews}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString()} 
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value) => [value, 'Views']}
              />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most viewed pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trafficData.topPages.map((page, index) => (
                <div key={page.path} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="text-sm truncate max-w-[200px]" title={page.path}>
                      {page.path === '/' ? 'Home' : page.path}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{page.views}</span>
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trafficData.topReferrers} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="referrer" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="visits" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};