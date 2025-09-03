import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Users,
  MousePointer,
  TrendingUp,
  Calendar,
  Target,
  Award,
  ExternalLink,
  Copy,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  conversionRate: number;
  thisMonthClicks: number;
  thisMonthConversions: number;
  thisMonthCommissions: number;
}

interface RecentActivity {
  id: string;
  type: 'click' | 'conversion' | 'commission_paid';
  description: string;
  amount?: number;
  timestamp: string;
}

export const AffiliateDashboard = () => {
  const [stats, setStats] = useState<AffiliateStats>({
    totalClicks: 0,
    totalConversions: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
    conversionRate: 0,
    thisMonthClicks: 0,
    thisMonthConversions: 0,
    thisMonthCommissions: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [affiliateCode, setAffiliateCode] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get user's affiliate code from their profile or generate one
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .single();
      
      if (profile) {
        // Generate affiliate code from user ID (simplified)
        const code = profile.user_id.substring(0, 8).toUpperCase();
        setAffiliateCode(code);
        
        // Load affiliate stats (mock data for now - in real implementation would query affiliate tables)
        const mockStats: AffiliateStats = {
          totalClicks: 1247,
          totalConversions: 23,
          totalCommissions: 2847.50,
          pendingCommissions: 485.00,
          paidCommissions: 2362.50,
          conversionRate: 1.84,
          thisMonthClicks: 156,
          thisMonthConversions: 4,
          thisMonthCommissions: 520.00
        };
        
        setStats(mockStats);
        
        // Load recent activity (mock data)
        const mockActivity: RecentActivity[] = [
          {
            id: '1',
            type: 'conversion',
            description: 'Circle Pro subscription signup',
            amount: 97.00,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            type: 'click',
            description: 'Clicked affiliate link from LinkedIn',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            type: 'commission_paid',
            description: 'Monthly commission payout',
            amount: 1250.00,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '4',
            type: 'conversion',
            description: 'Marketplace tool purchase',
            amount: 149.00,
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        setRecentActivity(mockActivity);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyAffiliateLink = () => {
    const link = `https://circle.realestate/pro?aff=${affiliateCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Affiliate link copied to clipboard",
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'click':
        return <MousePointer className="w-4 h-4 text-blue-500" />;
      case 'conversion':
        return <Target className="w-4 h-4 text-green-500" />;
      case 'commission_paid':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
          <p className="text-muted-foreground">Track your performance and earnings</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            Code: {affiliateCode}
          </Badge>
          <Button onClick={copyAffiliateLink} variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">
              +{formatCurrency(stats.thisMonthCommissions)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.thisMonthClicks} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversions}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.thisMonthConversions} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Above industry average
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="links">Links & Tools</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/50 rounded">
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Chart coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Top Performing Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { platform: 'LinkedIn Post', clicks: 156, conversions: 4 },
                    { platform: 'Email Campaign', clicks: 89, conversions: 3 },
                    { platform: 'Facebook Group', clicks: 67, conversions: 2 },
                    { platform: 'YouTube Video', clicks: 45, conversions: 1 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.platform}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.clicks} clicks • {item.conversions} conversions
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {((item.conversions / item.clicks) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats.pendingCommissions)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Awaiting 30-day verification period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paid Out</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.paidCommissions)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total commissions received
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Next Payout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.pendingCommissions)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Est. {new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Commission Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                  <div>
                    <p className="font-medium">Circle Pro Subscriptions</p>
                    <p className="text-sm text-muted-foreground">Recurring monthly revenue share</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">30%</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                  <div>
                    <p className="font-medium">Marketplace Tools</p>
                    <p className="text-sm text-muted-foreground">One-time purchase commission</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">15%</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                  <div>
                    <p className="font-medium">Consultation Bookings</p>
                    <p className="text-sm text-muted-foreground">Per booking commission</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">$50</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Affiliate Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Circle Pro Landing Page', url: `https://circle.realestate/pro?aff=${affiliateCode}`, clicks: 892 },
                  { name: 'Marketplace Homepage', url: `https://circle.realestate/marketplace?aff=${affiliateCode}`, clicks: 234 },
                  { name: 'Academy Access', url: `https://circle.realestate/academy?aff=${affiliateCode}`, clicks: 121 }
                ].map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <p className="font-medium">{link.name}</p>
                      <p className="text-sm text-muted-foreground break-all">{link.url}</p>
                      <p className="text-xs text-muted-foreground mt-1">{link.clicks} clicks</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(link.url);
                          toast({ title: "Copied!", description: "Link copied to clipboard" });
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                    {activity.amount && (
                      <Badge variant="secondary">
                        {formatCurrency(activity.amount)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};