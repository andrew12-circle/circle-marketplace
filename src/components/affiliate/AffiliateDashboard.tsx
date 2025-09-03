import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  DollarSign, 
  MousePointer, 
  Users,
  Calendar,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface AffiliateDashboardProps {
  affiliateId: string;
}

export const AffiliateDashboard = ({ affiliateId }: AffiliateDashboardProps) => {
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    conversionRate: 0,
    activeLinks: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, [affiliateId]);

  const loadDashboardStats = async () => {
    try {
      // Get affiliate links
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("id")
        .eq("affiliate_id", affiliateId)
        .eq("status", "active");

      // Get clicks
      const { data: clicks } = await supabase
        .from("affiliate_clicks")
        .select("id")
        .eq("affiliate_id", affiliateId);

      // Get conversions
      const { data: conversions } = await supabase
        .from("affiliate_conversions")
        .select("commission_amount, created_at")
        .eq("affiliate_id", affiliateId);

      const totalEarnings = conversions?.reduce((sum, conv) => sum + (conv.commission_amount || 0), 0) || 0;
      const totalClicks = clicks?.length || 0;
      const totalConversions = conversions?.length || 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0;

      // Calculate this month vs last month
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisMonthEarnings = conversions?.filter(conv => 
        new Date(conv.created_at) >= thisMonthStart
      ).reduce((sum, conv) => sum + (conv.commission_amount || 0), 0) || 0;

      const lastMonthEarnings = conversions?.filter(conv => {
        const date = new Date(conv.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      }).reduce((sum, conv) => sum + (conv.commission_amount || 0), 0) || 0;

      setStats({
        totalClicks,
        totalConversions,
        totalEarnings,
        conversionRate,
        activeLinks: links?.length || 0,
        thisMonthEarnings,
        lastMonthEarnings
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const earningsChange = stats.lastMonthEarnings > 0 
    ? ((stats.thisMonthEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings * 100)
    : stats.thisMonthEarnings > 0 ? 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {earningsChange >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-xs ${earningsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(earningsChange).toFixed(1)}% from last month
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  From {stats.activeLinks} active links
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MousePointer className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{stats.totalConversions}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.conversionRate.toFixed(1)}% conversion rate
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">${stats.thisMonthEarnings.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current month earnings
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Links</span>
                <Badge variant="outline">{stats.activeLinks}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average per Click</span>
                <span className="font-mono text-sm">
                  ${stats.totalClicks > 0 ? (stats.totalEarnings / stats.totalClicks).toFixed(4) : "0.00"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average per Conversion</span>
                <span className="font-mono text-sm">
                  ${stats.totalConversions > 0 ? (stats.totalEarnings / stats.totalConversions).toFixed(2) : "0.00"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <MousePointer className="w-4 h-4 mr-2" />
              Generate New Link
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              View Marketing Assets
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Detailed Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-2">Commission Structure</h3>
              <p className="text-green-700 text-sm mb-3">
                You earn 15% commission on all Circle Pro memberships and marketplace purchases. 
                Payments are processed monthly on the 15th.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-800">Circle Pro ($99/month):</span>
                  <br />
                  <span className="text-green-700">$14.85 per signup</span>
                </div>
                <div>
                  <span className="font-medium text-green-800">Marketplace purchases:</span>
                  <br />
                  <span className="text-green-700">15% of transaction value</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};