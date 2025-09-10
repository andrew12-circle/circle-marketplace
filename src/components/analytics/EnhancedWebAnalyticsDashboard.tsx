import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Users, Monitor, Globe, TrendingUp, Target, ExternalLink } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface EnhancedAnalyticsData {
  period: string;
  session_metrics: {
    total_sessions: number;
    unique_visitors: number;
    new_visitors: number;
    returning_visitors: number;
    avg_session_duration_minutes: number;
    bounce_rate_percent: number;
  };
  traffic_sources: {
    by_source_type: Array<{
      source_type: string;
      sessions: number;
      percentage: number;
    }>;
    top_referrers: Array<{
      domain: string;
      sessions: number;
    }>;
  };
  device_breakdown: {
    device_types: Array<{
      device_type: string;
      sessions: number;
      percentage: number;
    }>;
    browsers: Array<{
      browser: string;
      sessions: number;
    }>;
    operating_systems: Array<{
      os: string;
      sessions: number;
    }>;
  };
  geographic_data: {
    countries: Array<{
      country: string;
      sessions: number;
      percentage: number;
    }>;
    cities: Array<{
      city: string;
      sessions: number;
    }>;
  };
  conversions: {
    total_conversions: number;
    conversion_rate_percent: number;
    by_event_type: Array<{
      event_type: string;
      count: number;
      total_value: number;
    }>;
  };
  behavior_metrics: {
    top_exit_pages: Array<{
      page_url: string;
      exits: number;
      avg_time_on_page: number;
    }>;
    avg_scroll_depth: number;
  };
  generated_at: string;
}

const chartConfig = {
  sessions: {
    label: "Sessions",
    color: "hsl(var(--chart-1))",
  },
  conversions: {
    label: "Conversions", 
    color: "hsl(var(--chart-2))",
  },
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function EnhancedWebAnalyticsDashboard() {
  const [data, setData] = useState<EnhancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('30d');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase.rpc('get_web_analytics_enhanced', {
        p_period: timePeriod
      });

      if (error) {
        console.error('Analytics fetch error:', error);
        return;
      }

      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timePeriod]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading enhanced analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No analytics data available for the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Website Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into visitor behavior, traffic sources, and conversions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.session_metrics.total_sessions)}</div>
            <p className="text-xs text-muted-foreground">
              {data.session_metrics.unique_visitors} unique visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New vs Returning</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((data.session_metrics.new_visitors / data.session_metrics.total_sessions) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.session_metrics.new_visitors} new, {data.session_metrics.returning_visitors} returning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.session_metrics.avg_session_duration_minutes.toFixed(1)}m
            </div>
            <p className="text-xs text-muted-foreground">
              {data.session_metrics.bounce_rate_percent}% bounce rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.conversions.conversion_rate_percent}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.conversions.total_conversions} total conversions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
          <TabsTrigger value="devices">Devices & Browsers</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic by Source Type</CardTitle>
                <CardDescription>How visitors are finding your site</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.traffic_sources.by_source_type}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="sessions"
                        label={({ source_type, percentage }) => `${source_type}: ${percentage}%`}
                      >
                        {data.traffic_sources.by_source_type.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Referrers</CardTitle>
                <CardDescription>External sites driving traffic</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.traffic_sources.top_referrers?.slice(0, 5).map((referrer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{referrer.domain}</span>
                      </div>
                      <Badge variant="secondary">{referrer.sessions} sessions</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.device_breakdown.device_types?.map((device, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{device.device_type}</span>
                        <span>{device.percentage}%</span>
                      </div>
                      <Progress value={device.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Browsers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.device_breakdown.browsers?.slice(0, 5).map((browser, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{browser.browser}</span>
                      <Badge variant="secondary">{browser.sessions}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operating Systems</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.device_breakdown.operating_systems?.slice(0, 5).map((os, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{os.os}</span>
                      <Badge variant="secondary">{os.sessions}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
                <CardDescription>Geographic distribution of visitors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.geographic_data.countries?.slice(0, 10).map((country, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          {country.country}
                        </span>
                        <span>{country.percentage}%</span>
                      </div>
                      <Progress value={country.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Cities</CardTitle>
                <CardDescription>City-level visitor distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.geographic_data.cities?.slice(0, 10).map((city, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{city.city}</span>
                      <Badge variant="secondary">{city.sessions}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Events</CardTitle>
                <CardDescription>Business outcomes from your traffic</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.conversions.by_event_type}>
                      <XAxis dataKey="event_type" />
                      <YAxis />
                      <Bar dataKey="count" fill="hsl(var(--chart-1))" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Details</CardTitle>
                <CardDescription>Breakdown by event type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.conversions.by_event_type?.map((conversion, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium capitalize">{conversion.event_type.replace('_', ' ')}</h4>
                        <Badge>{conversion.count} events</Badge>
                      </div>
                      {conversion.total_value > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Total Value: ${conversion.total_value.toFixed(2)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Exit Pages</CardTitle>
                <CardDescription>Where users most commonly leave your site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.behavior_metrics.top_exit_pages?.slice(0, 8).map((page, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm truncate">{page.page_url}</span>
                        <Badge variant="destructive">{page.exits} exits</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Avg time: {Math.round(page.avg_time_on_page)}s
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scroll Engagement</CardTitle>
                <CardDescription>How far users scroll on your pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {data.behavior_metrics.avg_scroll_depth}%
                    </div>
                    <p className="text-sm text-muted-foreground">Average scroll depth</p>
                  </div>
                  <Progress value={data.behavior_metrics.avg_scroll_depth} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">Good Engagement</div>
                      <div className="text-xs text-muted-foreground">&gt;75% scroll depth</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">Needs Improvement</div>
                      <div className="text-xs text-muted-foreground">&lt;25% scroll depth</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(data.generated_at).toLocaleString()}
      </div>
    </div>
  );
}