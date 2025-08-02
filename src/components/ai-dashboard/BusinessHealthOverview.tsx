import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign, Home, Users, Target } from "lucide-react";

export const BusinessHealthOverview = () => {
  // Mock data - will be replaced with real data from MLS/CRM integrations
  const businessData = {
    commission: {
      current: 48200,
      goal: 60000,
      weeksRemaining: 8
    },
    pipeline: {
      activeListings: 3,
      activeBuyers: 2,
      closingsThisMonth: 1
    },
    performance: {
      avgDaysOnMarket: 25,
      marketAvg: 20,
      conversionRate: 12
    }
  };

  const commissionProgress = (businessData.commission.current / businessData.commission.goal) * 100;
  const isOnTrack = commissionProgress >= 75;

  return (
    <div>
      <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Target className="h-6 w-6 text-primary" />
        Your Business Health
      </h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Commission Goal */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Commission Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Q3 Progress</span>
                  <span className="font-medium">
                    ${businessData.commission.current.toLocaleString()} / ${businessData.commission.goal.toLocaleString()}
                  </span>
                </div>
                <Progress value={commissionProgress} className="h-2" />
              </div>
              <div className="flex items-center gap-2">
                {isOnTrack ? (
                  <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-500/20">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    On Track
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 border-orange-500/20">
                    Needs Focus
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {businessData.commission.weeksRemaining} weeks remaining
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Overview */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-500" />
              Pipeline Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Listings</span>
                <span className="font-semibold">{businessData.pipeline.activeListings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Buyers</span>
                <span className="font-semibold">{businessData.pipeline.activeBuyers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Closings This Month</span>
                <span className="font-semibold">{businessData.pipeline.closingsThisMonth}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Avg Days on Market</span>
                  <span className="font-semibold">{businessData.performance.avgDaysOnMarket}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Market avg: {businessData.performance.marketAvg} days
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conversion Rate</span>
                <span className="font-semibold">{businessData.performance.conversionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};