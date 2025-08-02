import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Download, TrendingUp, MapPin, PieChart, BarChart3, Brain, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import { DealsTable } from "@/components/command-center/DealsTable";
import { GeographicHeatMap } from "@/components/command-center/GeographicHeatMap";
import { BusinessMixChart } from "@/components/command-center/BusinessMixChart";
import { SalePriceTrendChart } from "@/components/command-center/SalePriceTrendChart";
import { useToast } from "@/hooks/use-toast";

interface Deal {
  id: string;
  address: string;
  close_date: string;
  role: 'buyer' | 'seller';
  sale_price: number;
  lender_name?: string;
  title_company?: string;
  status: 'verified' | 'pending' | 'missing_info';
  created_at: string;
  user_id: string;
}

interface KPIData {
  ytd_volume: number;
  avg_sale_price: number;
  ytd_commission: number;
  goal_progress: number;
  goal_target: number;
}

export const CommandCenter = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [kpiData, setKpiData] = useState<KPIData>({
    ytd_volume: 0,
    avg_sale_price: 0,
    ytd_commission: 0,
    goal_progress: 0,
    goal_target: 100000
  });
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration - in production this would come from MLS integration
  useEffect(() => {
    const mockDeals: Deal[] = [
      {
        id: "1",
        address: "123 Main St, Franklin, TN",
        close_date: "2024-07-15",
        role: "seller",
        sale_price: 1200000,
        lender_name: "Jane Doe - Franklin Mortgage",
        title_company: "Reliant Title",
        status: "verified",
        created_at: "2024-07-15T00:00:00Z",
        user_id: user?.id || ""
      },
      {
        id: "2", 
        address: "456 Oak Ave, Franklin, TN",
        close_date: "2024-06-28",
        role: "buyer",
        sale_price: 850000,
        lender_name: "John Smith - Music City Lending",
        title_company: "Reliant Title",
        status: "verified",
        created_at: "2024-06-28T00:00:00Z",
        user_id: user?.id || ""
      },
      {
        id: "3",
        address: "789 Maple Ln, Franklin, TN", 
        close_date: "2024-08-01",
        role: "seller",
        sale_price: 910000,
        lender_name: undefined,
        title_company: undefined,
        status: "missing_info",
        created_at: "2024-08-01T00:00:00Z",
        user_id: user?.id || ""
      }
    ];

    setDeals(mockDeals);

    // Calculate KPIs from deals
    const totalVolume = mockDeals.reduce((sum, deal) => sum + deal.sale_price, 0);
    const avgPrice = totalVolume / mockDeals.length;
    const estimatedCommission = totalVolume * 0.025; // 2.5% commission rate
    const goalTarget = 100000;
    const goalProgress = (estimatedCommission / goalTarget) * 100;

    setKpiData({
      ytd_volume: totalVolume,
      avg_sale_price: avgPrice,
      ytd_commission: estimatedCommission,
      goal_progress: Math.min(goalProgress, 100),
      goal_target: goalTarget
    });

    setLoading(false);
  }, [user?.id]);

  const handleDealUpdate = (updatedDeal: Deal) => {
    setDeals(prev => prev.map(deal => 
      deal.id === updatedDeal.id ? updatedDeal : deal
    ));
    
    toast({
      title: "Deal Updated",
      description: "Your deal information has been verified and fed to the AI engine.",
    });
  };

  const exportToSheets = (type: 'kpi' | 'deals') => {
    toast({
      title: "Export Started",
      description: `Exporting ${type === 'kpi' ? 'KPI data' : 'deals data'} to Google Sheets...`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your command center...</p>
        </div>
      </div>
    );
  }

  const verifiedDeals = deals.filter(deal => deal.status === 'verified').length;
  const missingInfoDeals = deals.filter(deal => deal.status === 'missing_info').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Command Center</h1>
          <p className="text-muted-foreground text-lg">
            Your business performance at a glance. Verify your data to power your AI insights.
          </p>
        </div>

        {/* KPI Header Bar */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Key Performance Indicators</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToSheets('kpi')}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export to Sheets
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  ${(kpiData.ytd_volume / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-muted-foreground">YTD Sales Volume</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  ${(kpiData.avg_sale_price / 1000).toFixed(0)}k
                </div>
                <div className="text-sm text-muted-foreground">Avg. Sale Price</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  ${kpiData.ytd_commission.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">YTD Commission (Est.)</div>
              </div>
              <div className="text-center">
                <div className="mb-2">
                  <Progress value={kpiData.goal_progress} className="h-3" />
                </div>
                <div className="text-lg font-bold text-primary">
                  {kpiData.goal_progress.toFixed(0)}% of ${(kpiData.goal_target / 1000).toFixed(0)}k Goal
                </div>
                <div className="text-sm text-muted-foreground">Goal Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Quality Alert */}
        {missingInfoDeals > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800">
                    {missingInfoDeals} deal{missingInfoDeals > 1 ? 's' : ''} missing partner information
                  </p>
                  <p className="text-sm text-amber-700">
                    Complete your deal data below to improve AI recommendations
                  </p>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {verifiedDeals}/{deals.length} Verified
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Deals Table */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                My Deals - The AI Engine
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToSheets('deals')}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export to Sheets
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Verify and complete your deal information to power smarter AI insights
            </p>
          </CardHeader>
          <CardContent>
            <DealsTable deals={deals} onDealUpdate={handleDealUpdate} />
          </CardContent>
        </Card>

        {/* Performance Dashboards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Geographic Heat Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GeographicHeatMap deals={deals.filter(d => d.status === 'verified')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Business Mix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BusinessMixChart deals={deals.filter(d => d.status === 'verified')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Price Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalePriceTrendChart deals={deals.filter(d => d.status === 'verified')} />
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Bridge */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Brain className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Your Data Looks Clear.</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Now, let's put it to work. Go to your AI Concierge Dashboard to see personalized 
              recommendations, market predictions, and partner scorecards generated from your performance data.
            </p>
            <Button size="lg" className="gap-2" onClick={() => window.location.href = '/ai-dashboard'}>
              <Brain className="w-5 h-5" />
              Take Me to My AI Concierge
              <ArrowRight className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};