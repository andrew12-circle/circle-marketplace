import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, Building } from 'lucide-react';
import { AgentStats } from '@/hooks/useAgentData';

interface PerformanceSnapshotProps {
  stats: AgentStats;
}

export const PerformanceSnapshot = ({ stats }: PerformanceSnapshotProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.buyerDeals}</div>
            <div className="text-sm text-muted-foreground">Buyer Side Deals</div>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.avgBuyerPrice)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Buyer Price</div>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Building className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.sellerDeals}</div>
            <div className="text-sm text-muted-foreground">Seller Side Deals</div>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.avgSellerPrice)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Seller Price</div>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.totalVolume)}
            </div>
            <div className="text-sm text-muted-foreground">Total Volume</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};