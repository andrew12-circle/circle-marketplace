import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, 
  TrendingUp, 
  MousePointer, 
  DollarSign,
  Calendar,
  Globe,
  Target,
  Clock,
  Users,
  Zap
} from "lucide-react";

interface AffiliateAnalyticsProps {
  affiliateId: string;
}

interface AnalyticsData {
  clicks: number;
  conversions: number;
  earnings: number;
  period: string;
}

export const AffiliateAnalytics = ({ affiliateId }: AffiliateAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState("30d");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [topLinks, setTopLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    conversionRate: 0,
    avgClicksPerDay: 0,
    avgEarningsPerClick: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, [affiliateId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    
    try {
      const daysBack = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Get clicks data
      const { data: clicks } = await supabase
        .from("affiliate_clicks")
        .select("clicked_at, link_id")
        .eq("affiliate_id", affiliateId)
        .gte("clicked_at", startDate.toISOString());

      // Get conversions data
      const { data: conversions } = await supabase
        .from("affiliate_conversions")
        .select("commission_amount, created_at, link_id")
        .eq("affiliate_id", affiliateId)
        .gte("created_at", startDate.toISOString());

      // Get affiliate links with stats
      const { data: links } = await supabase
        .from("affiliate_links")
        .select(`
          id, 
          code, 
          destination_type, 
          campaign_name,
          created_at
        `)
        .eq("affiliate_id", affiliateId);

      // Process data for charts
      const chartData: AnalyticsData[] = [];
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayClicks = clicks?.filter(click => 
          click.clicked_at.startsWith(dateStr)
        ).length || 0;
        
        const dayConversions = conversions?.filter(conv => 
          conv.created_at.startsWith(dateStr)
        ).length || 0;
        
        const dayEarnings = conversions?.filter(conv => 
          conv.created_at.startsWith(dateStr)
        ).reduce((sum, conv) => sum + (conv.commission_amount || 0), 0) || 0;

        chartData.push({
          clicks: dayClicks,
          conversions: dayConversions,
          earnings: dayEarnings,
          period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }

      // Calculate link performance
      const linkStats = links?.map(link => {
        const linkClicks = clicks?.filter(click => click.link_id === link.id).length || 0;
        const linkConversions = conversions?.filter(conv => conv.link_id === link.id).length || 0;
        const linkEarnings = conversions?.filter(conv => conv.link_id === link.id)
          .reduce((sum, conv) => sum + (conv.commission_amount || 0), 0) || 0;
        
        return {
          ...link,
          clicks: linkClicks,
          conversions: linkConversions,
          earnings: linkEarnings,
          conversionRate: linkClicks > 0 ? (linkConversions / linkClicks * 100) : 0
        };
      }).sort((a, b) => b.earnings - a.earnings) || [];

      // Calculate totals
      const totalClicks = clicks?.length || 0;
      const totalConversions = conversions?.length || 0;
      const totalEarnings = conversions?.reduce((sum, conv) => sum + (conv.commission_amount || 0), 0) || 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0;
      const avgClicksPerDay = totalClicks / daysBack;
      const avgEarningsPerClick = totalClicks > 0 ? totalEarnings / totalClicks : 0;

      setAnalyticsData(chartData);
      setTopLinks(linkStats.slice(0, 5));
      setTotalStats({
        totalClicks,
        totalConversions,
        totalEarnings,
        conversionRate,
        avgClicksPerDay,
        avgEarningsPerClick
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track your affiliate performance and optimize your campaigns</p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Clicks</p>
                <p className="text-xl font-bold">{totalStats.totalClicks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Conversions</p>
                <p className="text-xl font-bold">{totalStats.totalConversions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Earnings</p>
                <p className="text-xl font-bold">${totalStats.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Conv. Rate</p>
                <p className="text-xl font-bold">{totalStats.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Daily Avg</p>
                <p className="text-xl font-bold">{totalStats.avgClicksPerDay.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Per Click</p>
                <p className="text-xl font-bold">${totalStats.avgEarningsPerClick.toFixed(3)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="links">Top Links</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chart visualization would go here</p>
                  <p className="text-sm">Showing clicks, conversions, and earnings trends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Top Performing Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topLinks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No link data available yet</p>
                    <p className="text-sm">Create some affiliate links to see performance data</p>
                  </div>
                ) : (
                  topLinks.map((link, index) => (
                    <div key={link.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{link.campaign_name || `${link.destination_type} Link`}</p>
                          <p className="text-sm text-muted-foreground font-mono">{link.code}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{link.clicks}</p>
                          <p className="text-muted-foreground">Clicks</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{link.conversions}</p>
                          <p className="text-muted-foreground">Conversions</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{link.conversionRate.toFixed(1)}%</p>
                          <p className="text-muted-foreground">Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">${link.earnings.toFixed(2)}</p>
                          <p className="text-muted-foreground">Earnings</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Best performing destination:</span>
                    <Badge variant="outline">
                      {topLinks[0]?.destination_type || "N/A"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Highest conversion rate:</span>
                    <span className="font-mono text-sm">
                      {Math.max(...topLinks.map(l => l.conversionRate)).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total active campaigns:</span>
                    <span className="font-mono text-sm">
                      {new Set(topLinks.map(l => l.campaign_name).filter(Boolean)).size}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Optimization Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">💡 Focus on High Performers</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Promote your best converting links more actively to maximize earnings.
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">📈 A/B Testing</p>
                  <p className="text-xs text-green-700 mt-1">
                    Try different UTM campaigns to see what resonates with your audience.
                  </p>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-900">🎯 Diversify Traffic</p>
                  <p className="text-xs text-purple-700 mt-1">
                    Create links for different destinations to capture varied interests.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};