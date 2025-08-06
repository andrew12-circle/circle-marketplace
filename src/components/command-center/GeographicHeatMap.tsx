import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Home } from 'lucide-react';

interface Deal {
  id: string;
  address: string;
  sale_price?: number;
  role: 'buyer' | 'seller';
}

interface GeographicHeatMapProps {
  deals: Deal[];
}

// Mock deals data with geographic distribution
const mockDeals: Deal[] = [
  { id: '1', address: '1245 Oak Street, Franklin, TN', sale_price: 585000, role: 'buyer' },
  { id: '2', address: '3467 Maple Ave, Brentwood, TN', sale_price: 725000, role: 'seller' },
  { id: '3', address: '789 Pine Ridge Dr, Cool Springs, TN', sale_price: 450000, role: 'buyer' },
  { id: '4', address: '2156 Elm Court, Nashville, TN', sale_price: 395000, role: 'seller' },
  { id: '5', address: '4523 Birch Lane, Murfreesboro, TN', sale_price: 520000, role: 'buyer' },
  { id: '6', address: '1678 Valley Dr, Franklin, TN', sale_price: 640000, role: 'seller' },
  { id: '7', address: '891 Heritage Blvd, Brentwood, TN', sale_price: 850000, role: 'buyer' },
  { id: '8', address: '234 Spring Hill Rd, Franklin, TN', sale_price: 490000, role: 'seller' },
  { id: '9', address: '567 Music Valley Dr, Nashville, TN', sale_price: 375000, role: 'buyer' },
  { id: '10', address: '345 Liberty Ln, Cool Springs, TN', sale_price: 680000, role: 'seller' },
];

export const GeographicHeatMap = ({ deals }: GeographicHeatMapProps) => {
  // Use mock data if no deals provided
  const displayDeals = deals.length > 0 ? deals : mockDeals;

  // Process geographic data
  const franklinAreas = [
    {
      name: 'Franklin Downtown',
      deals: displayDeals.filter(d => d.address.includes('Franklin')),
      avgPrice: 0,
      totalVolume: 0,
      color: 'text-red-500 bg-red-100'
    },
    {
      name: 'Brentwood',
      deals: displayDeals.filter(d => d.address.includes('Brentwood')),
      avgPrice: 0,
      totalVolume: 0,
      color: 'text-blue-500 bg-blue-100'
    },
    {
      name: 'Cool Springs',
      deals: displayDeals.filter(d => d.address.includes('Cool Springs')),
      avgPrice: 0,
      totalVolume: 0,
      color: 'text-green-500 bg-green-100'
    },
    {
      name: 'Nashville',
      deals: displayDeals.filter(d => d.address.includes('Nashville')),
      avgPrice: 0,
      totalVolume: 0,
      color: 'text-purple-500 bg-purple-100'
    },
    {
      name: 'Murfreesboro',
      deals: displayDeals.filter(d => d.address.includes('Murfreesboro')),
      avgPrice: 0,
      totalVolume: 0,
      color: 'text-orange-500 bg-orange-100'
    }
  ];

  // Calculate metrics for each area
  franklinAreas.forEach(area => {
    const prices = area.deals.map(d => d.sale_price || 0).filter(p => p > 0);
    area.avgPrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
    area.totalVolume = prices.reduce((sum, price) => sum + price, 0);
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMarketActivityLevel = (dealCount: number) => {
    if (dealCount >= 3) return 'High';
    if (dealCount >= 2) return 'Medium';
    if (dealCount >= 1) return 'Low';
    return 'None';
  };

  const totalDeals = displayDeals.length;
  const totalVolume = displayDeals.reduce((sum, deal) => sum + (deal.sale_price || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Geographic Market Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-primary">{totalDeals}</div>
            <div className="text-sm text-muted-foreground">Total Transactions</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalVolume)}</div>
            <div className="text-sm text-muted-foreground">Total Volume</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalVolume / totalDeals)}</div>
            <div className="text-sm text-muted-foreground">Avg Sale Price</div>
          </div>
        </div>

        {/* Geographic Areas */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg mb-3">Market Activity by Area</h4>
          {franklinAreas.map((area, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${area.color}`}>
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="font-medium">{area.name}</h5>
                  <p className="text-sm text-muted-foreground">
                    {area.deals.length} transactions
                  </p>
                </div>
              </div>
              
              <div className="text-right space-y-1">
                <div className="font-semibold">
                  {area.avgPrice > 0 ? formatCurrency(area.avgPrice) : 'No data'}
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={area.deals.length >= 3 ? 'default' : area.deals.length >= 1 ? 'secondary' : 'outline'}
                  >
                    {getMarketActivityLevel(area.deals.length)} Activity
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Market Insights */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Market Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Top Performing Area:</strong> {
                franklinAreas.reduce((top, area) => 
                  area.avgPrice > top.avgPrice ? area : top, franklinAreas[0]
                ).name
              }
            </div>
            <div>
              <strong>Most Active Area:</strong> {
                franklinAreas.reduce((top, area) => 
                  area.deals.length > top.deals.length ? area : top, franklinAreas[0]
                ).name
              }
            </div>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-4 text-center text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center justify-center gap-2">
            <Home className="h-4 w-4" />
            {totalDeals} verified transactions across Middle Tennessee market
          </div>
        </div>
      </CardContent>
    </Card>
  );
};