import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, TrendingUp, Users, Clock, MousePointer, BarChart3, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WebAnalyticsData {
  period: string;
  metrics: {
    total_sessions: number;
    unique_visitors: number;
    avg_session_duration_minutes: number;
    avg_pages_per_session: number;
    bounce_rate_percent: number;
  };
  top_pages: Array<{
    page_url: string;
    page_title: string | null;
    views: number;
    unique_visitors: number;
    avg_time_on_page: number;
    exit_rate: number;
  }>;
  top_clicks: Array<{
    element_selector: string;
    element_text: string | null;
    clicks: number;
    unique_clickers: number;
    pages_clicked: number;
  }>;
  generated_at: string;
}

export function WebsiteAnalyticsDashboard() {
  const [data, setData] = useState<WebAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('30d');
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: analyticsData, error } = await supabase.rpc('get_web_analytics', {
        p_period: timePeriod
      });

      if (error) {
        console.error('Analytics fetch error:', error);
        toast({
          title: "Error loading analytics",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setData(analyticsData);
    } catch (error) {
      console.error('Analytics fetch failed:', error);
      toast({
        title: "Failed to load analytics",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timePeriod]);

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    if (minutes < 60) return `${Math.round(minutes)}m`;
    return `${Math.round(minutes / 60)}h ${Math.round(minutes % 60)}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No analytics data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Website Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive visitor behavior and engagement metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
          
          <Button onClick={fetchAnalytics} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.metrics.total_sessions)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.metrics.unique_visitors)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(data.metrics.avg_session_duration_minutes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages per Session</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.avg_pages_per_session.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.bounce_rate_percent}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Top Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.top_pages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No page views recorded yet
              </div>
            ) : (
              data.top_pages.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium">{page.page_url}</div>
                    {page.page_title && (
                      <div className="text-sm text-muted-foreground">{page.page_title}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{formatNumber(page.views)}</div>
                      <div className="text-muted-foreground">Views</div>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="text-center">
                      <div className="font-medium">{formatNumber(page.unique_visitors)}</div>
                      <div className="text-muted-foreground">Visitors</div>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="text-center">
                      <div className="font-medium">{formatDuration(page.avg_time_on_page)}</div>
                      <div className="text-muted-foreground">Avg Time</div>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="text-center">
                      <div className="font-medium">{page.exit_rate}%</div>
                      <div className="text-muted-foreground">Exit Rate</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Click Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="h-5 w-5" />
            Top Click Targets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.top_clicks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No click events recorded yet
              </div>
            ) : (
              data.top_clicks.map((click, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {click.element_selector}
                      </Badge>
                      {click.element_text && (
                        <span className="text-sm text-muted-foreground">
                          "{click.element_text.substring(0, 50)}{click.element_text.length > 50 ? '...' : ''}"
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{formatNumber(click.clicks)}</div>
                      <div className="text-muted-foreground">Clicks</div>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="text-center">
                      <div className="font-medium">{formatNumber(click.unique_clickers)}</div>
                      <div className="text-muted-foreground">Unique</div>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="text-center">
                      <div className="font-medium">{click.pages_clicked}</div>
                      <div className="text-muted-foreground">Pages</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        Last updated: {new Date(data.generated_at).toLocaleString()}
      </div>
    </div>
  );
}