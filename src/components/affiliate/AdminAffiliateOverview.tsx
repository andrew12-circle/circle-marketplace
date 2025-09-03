import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  totalAffiliates: number;
  pendingApplications: number;
  activeAffiliates: number;
  totalCommissionsPaid: number;
  monthlyGrowth: number;
  fraudAlerts: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
}

export const AdminAffiliateOverview = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats>({
    totalAffiliates: 0,
    pendingApplications: 0,
    activeAffiliates: 0,
    totalCommissionsPaid: 0,
    monthlyGrowth: 0,
    fraudAlerts: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // Load affiliate statistics
      const { data: affiliates, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*');

      if (affiliateError) throw affiliateError;

      // Load payout data
      const { data: payouts, error: payoutError } = await supabase
        .from('affiliate_payouts')
        .select('*')
        .eq('payout_status', 'completed');

      if (payoutError) throw payoutError;

      // Load fraud checks
      const { data: fraudChecks, error: fraudError } = await supabase
        .from('affiliate_fraud_checks')
        .select('*')
        .eq('flagged', true);

      if (fraudError) throw fraudError;

      // Calculate stats
      const totalCommissionsPaid = payouts?.reduce((sum, p) => sum + Number(p.payout_amount), 0) || 0;
      const activeCount = affiliates?.filter(a => a.status === 'active').length || 0;
      const pendingCount = affiliates?.filter(a => a.onboarding_status === 'pending_kyc').length || 0;

      setStats({
        totalAffiliates: affiliates?.length || 0,
        pendingApplications: pendingCount,
        activeAffiliates: activeCount,
        totalCommissionsPaid,
        monthlyGrowth: 15.2, // Mock data
        fraudAlerts: fraudChecks?.length || 0
      });

      // Mock recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'application',
          description: 'New affiliate application from Sarah Johnson',
          timestamp: new Date().toISOString(),
          status: 'pending'
        },
        {
          id: '2',
          type: 'payout',
          description: 'Monthly payout processed for $2,450',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'completed'
        },
        {
          id: '3',
          type: 'fraud',
          description: 'Fraud alert: Suspicious referral pattern detected',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'alert'
        }
      ]);

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load affiliate data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application': return <Users className="w-4 h-4" />;
      case 'payout': return <DollarSign className="w-4 h-4" />;
      case 'fraud': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      completed: 'default',
      alert: 'destructive'
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Affiliates</p>
                <p className="text-2xl font-bold">{stats.totalAffiliates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingApplications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.activeAffiliates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">${stats.totalCommissionsPaid.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Growth</p>
                <p className="text-2xl font-bold">+{stats.monthlyGrowth}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Fraud Alerts</p>
                <p className="text-2xl font-bold">{stats.fraudAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getActivityIcon(activity.type)}
                        <div>
                          <p className="font-medium text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {getActivityBadge(activity.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Review Pending Applications ({stats.pendingApplications})
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Process Monthly Payouts
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Review Fraud Alerts ({stats.fraudAlerts})
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Performance Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Application management will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Payout management will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraud">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Fraud detection dashboard will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};