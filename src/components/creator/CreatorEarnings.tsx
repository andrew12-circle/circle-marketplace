import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Play,
  Calendar,
  Download,
  Eye,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface EarningsData {
  total_plays: number;
  total_revenue: number;
  avg_rating: number;
  content_count: number;
  monthly_plays: number;
  monthly_revenue: number;
  estimated_monthly_earnings: number;
}

interface ContentPerformance {
  id: string;
  title: string;
  content_type: string;
  total_plays: number;
  total_revenue: number;
  rating: number;
  created_at: string;
}

interface MonthlyData {
  month: string;
  plays: number;
  revenue: number;
  earnings: number;
}

export const CreatorEarnings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [topContent, setTopContent] = useState<ContentPerformance[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    if (user) {
      fetchEarningsData();
      fetchTopContent();
      fetchMonthlyData();
    }
  }, [user]);

  const fetchEarningsData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_creator_earnings_summary', { creator_user_id: user.id });

      if (error) throw error;
      setEarningsData(data as unknown as EarningsData);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load earnings data',
        variant: 'destructive'
      });
    }
  };

  const fetchTopContent = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('content')
        .select('id, title, content_type, total_plays, total_revenue, rating, created_at')
        .eq('creator_id', user.id)
        .eq('is_published', true)
        .order('total_revenue', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTopContent(data || []);
    } catch (error) {
      console.error('Error fetching top content:', error);
    }
  };

  const fetchMonthlyData = async () => {
    if (!user) return;

    try {
      // Mock monthly data for the last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          plays: Math.floor(Math.random() * 1000) + 100,
          revenue: Math.floor(Math.random() * 500) + 50,
          earnings: Math.floor(Math.random() * 375) + 37.5
        });
      }
      setMonthlyData(months);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'podcast': return '🎧';
      case 'book': return '📚';
      case 'course': return '🎓';
      case 'playbook': return '📖';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-muted-foreground">Loading earnings data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(earningsData?.total_revenue ? earningsData.total_revenue * 0.25 : 0)}
            </div>
            <p className="text-xs text-muted-foreground">25% revenue share</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(earningsData?.estimated_monthly_earnings || 0)}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
            <Play className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(earningsData?.total_plays || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earningsData?.avg_rating?.toFixed(1) || '0.0'}/5
            </div>
            <p className="text-xs text-muted-foreground">From user reviews</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Top Content</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Gross Revenue</span>
                  <span className="font-medium">
                    {formatCurrency(earningsData?.total_revenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Platform Fee (75%)</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency((earningsData?.total_revenue || 0) * 0.75)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Your Earnings (25%)</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency((earningsData?.total_revenue || 0) * 0.25)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Published Content</span>
                  <Badge variant="secondary">{earningsData?.content_count || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Monthly Plays</span>
                  <Badge variant="secondary">{(earningsData?.monthly_plays || 0).toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg. Revenue per Play</span>
                  <Badge variant="secondary">
                    {formatCurrency((earningsData?.total_revenue || 0) / Math.max(earningsData?.total_plays || 1, 1))}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Engagement Rate</span>
                  <Badge variant="secondary">
                    {((earningsData?.avg_rating || 0) / 5 * 100).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your highest earning content items
              </p>
            </CardHeader>
            <CardContent>
              {topContent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No content data available yet</p>
                  <p className="text-sm">Upload and publish content to see performance metrics</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topContent.map((content, index) => (
                    <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm">
                          {getContentTypeIcon(content.content_type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{content.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{content.content_type}</span>
                            <span>•</span>
                            <span>{new Date(content.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">
                          {formatCurrency(content.total_revenue * 0.25)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {content.total_plays.toLocaleString()} plays
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your earnings and engagement trends over time
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((month, index) => (
                  <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{month.month}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{month.plays.toLocaleString()}</div>
                        <div className="text-muted-foreground">Plays</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{formatCurrency(month.revenue)}</div>
                        <div className="text-muted-foreground">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">{formatCurrency(month.earnings)}</div>
                        <div className="text-muted-foreground">Earnings</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your payout settings and history
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Next Payout</h4>
                <div className="flex justify-between items-center">
                  <span>Available for payout:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency((earningsData?.total_revenue || 0) * 0.25)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Payouts are processed monthly on the 15th
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Payout History</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium">January 2024</div>
                      <div className="text-sm text-muted-foreground">Paid on Jan 15, 2024</div>
                    </div>
                    <Badge variant="secondary">{formatCurrency(245.50)}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium">December 2023</div>
                      <div className="text-sm text-muted-foreground">Paid on Dec 15, 2023</div>
                    </div>
                    <Badge variant="secondary">{formatCurrency(189.25)}</Badge>
                  </div>
                </div>
              </div>

              <Button className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Tax Documents
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};