import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DollarSign, 
  MousePointer, 
  TrendingUp, 
  Users,
  Link as LinkIcon,
  Download,
  BarChart3,
  Settings,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { AffiliateLinks } from "@/components/affiliate/AffiliateLinks";
import { AffiliateAssets } from "@/components/affiliate/AffiliateAssets";
import { AffiliateReports } from "@/components/affiliate/AffiliateReports";
import { AffiliatePayments } from "@/components/affiliate/AffiliatePayments";
import { AffiliateSettings } from "@/components/affiliate/AffiliateSettings";

interface AffiliateStats {
  balance: number;
  last30DaysEarnings: number;
  totalEarnings: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  topLinks: any[];
}

export const AffiliateDashboard = () => {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<any>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    }
  }, [user]);

  const loadAffiliateData = async () => {
    try {
      // Load affiliate profile
      const { data: affiliateData, error: affiliateError } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (affiliateError && affiliateError.code !== 'PGRST116') {
        throw affiliateError;
      }

      setAffiliate(affiliateData);

      if (affiliateData) {
        // Load stats
        const statsData = await loadAffiliateStats(affiliateData.id);
        setStats(statsData);
      }
    } catch (error: any) {
      console.error("Error loading affiliate data:", error);
      toast.error("Failed to load affiliate data");
    } finally {
      setLoading(false);
    }
  };

  const loadAffiliateStats = async (affiliateId: string): Promise<AffiliateStats> => {
    // This would normally query the actual tables, but for now return mock data
    return {
      balance: 234.50,
      last30DaysEarnings: 156.20,
      totalEarnings: 1247.80,
      totalClicks: 482,
      totalConversions: 12,
      conversionRate: 2.49,
      topLinks: []
    };
  };

  const getProgressStatus = () => {
    if (!affiliate) return { progress: 0, label: "Getting started..." };
    
    let progress = 25; // Basic signup complete
    let label = "Almost ready";
    
    if (affiliate.agreement_signed_at) progress += 25;
    if (affiliate.payout_method) progress += 25;
    if (affiliate.tax_id) progress += 25;
    
    if (progress >= 100) {
      label = "Payout ready";
    } else if (progress >= 75) {
      label = "Almost ready";
    } else {
      label = "Getting started";
    }
    
    return { progress, label };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No Affiliate Profile Found</h2>
          <p className="text-muted-foreground mb-6">
            You haven't applied to the affiliate program yet.
          </p>
          <Button asChild>
            <a href="/affiliate/apply">Apply Now</a>
          </Button>
        </div>
      </div>
    );
  }

  const { progress, label } = getProgressStatus();

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {affiliate.legal_name}
              </p>
            </div>
            <Badge variant={affiliate.onboarding_status === 'approved' ? 'default' : 'secondary'}>
              {affiliate.onboarding_status.replace('_', ' ')}
            </Badge>
          </div>
          
          {/* Progress Meter */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">{label}</span>
                <span className="text-sm text-muted-foreground">{progress}% complete</span>
              </div>
              <Progress value={progress} className="mb-3" />
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Account created</span>
                </div>
                {affiliate.agreement_signed_at && (
                  <div className="flex items-center gap-1 text-xs">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Agreement signed</span>
                  </div>
                )}
                {affiliate.payout_method ? (
                  <div className="flex items-center gap-1 text-xs">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Payout method set</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span>Payout method needed</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Links
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Current Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-8 h-8 text-green-500" />
                    <span className="text-2xl font-bold">${stats?.balance.toFixed(2) || '0.00'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Last 30 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-8 h-8 text-primary" />
                    <span className="text-2xl font-bold">${stats?.last30DaysEarnings.toFixed(2) || '0.00'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Clicks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-8 h-8 text-blue-500" />
                    <span className="text-2xl font-bold">{stats?.totalClicks || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Conversions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="w-8 h-8 text-accent" />
                    <span className="text-2xl font-bold">{stats?.totalConversions || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.conversionRate.toFixed(2) || '0.00'}% conversion rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-center">
                      <LinkIcon className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-semibold">Create Link</div>
                      <div className="text-xs text-muted-foreground">Get your custom affiliate link</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-center">
                      <Download className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-semibold">Download Assets</div>
                      <div className="text-xs text-muted-foreground">Banners, copy, and more</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-center">
                      <BarChart3 className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-semibold">View Reports</div>
                      <div className="text-xs text-muted-foreground">Track your performance</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links">
            <AffiliateLinks affiliateId={affiliate.id} />
          </TabsContent>

          <TabsContent value="assets">
            <AffiliateAssets />
          </TabsContent>

          <TabsContent value="reports">
            <AffiliateReports affiliateId={affiliate.id} />
          </TabsContent>

          <TabsContent value="payments">
            <AffiliatePayments affiliateId={affiliate.id} />
          </TabsContent>

          <TabsContent value="settings">
            <AffiliateSettings affiliate={affiliate} onUpdate={loadAffiliateData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};